const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs') // 需要安装: npm install bcryptjs
const { findUserByUsername, createUser } = require('../models')

module.exports = {
  async register(ctx) {
    try {
      console.log('注册请求体:', ctx.request.body)
      const { echo_id, password } = ctx.request.body
      if (!echo_id || !password) {
        ctx.status = 400
        ctx.body = { success: false, status:400, error: 'echo_id and password required' }
        return
      }
      const existing = await findUserByUsername(echo_id)
      if (existing) {
        ctx.status = 409
        ctx.body = { success: false, status:409, error: 'echo_id already exists' }
        return
      }
      const hashedPassword = await bcrypt.hash(password, 10)
      const timestamp = Date.now().toString().slice(-6); // 取后6位
      const nickName = `用户${timestamp}`;
      const userId = await createUser(echo_id, nickName, hashedPassword) // 修正
      const token = jwt.sign({ id: userId, echo_id }, process.env.JWT_SECRET, { expiresIn: '7d' })
      ctx.body = { success: true,  status:200, token, user: { id: userId, echo_id } } // 添加 success 字段
    } catch (err) {
      console.error('注册错误:', err)
      ctx.status = 500
      ctx.body = { success: false, status:500, error: err.message }
    }
  },

  async login(ctx) {
    try {
      console.log('登录请求体:', ctx.request.body)
      const { echo_id, password } = ctx.request.body
      const user = await findUserByUsername(echo_id)
      if (!user) {
        ctx.status = 401
        ctx.body = { success: false, status:401, error: 'Invalid credentials' }
        return
      }
      // 密码验证
      const valid = await bcrypt.compare(password, user.password_hash)
      if (!valid) {
        ctx.status = 401
        ctx.body = { success: false, status:401, error: 'Invalid credentials' }
        return
      }
      // 登录成功，返回 JWT 令牌
      const token = jwt.sign({ id: user.id, echo_id }, process.env.JWT_SECRET, { expiresIn: '7d' })

      ctx.body = { success: true, status:200, token, user }
    } catch (err) {
      console.error('登录错误:', err)
      ctx.status = 500
      ctx.body = { success: false, status:500, error: err.message }
    }
  }
}