const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs') // 需要安装: npm install bcryptjs
const { findUserByUsername, createUser } = require('../models')

module.exports = {
  async register(ctx) {
    try {
      console.log('注册请求体:', ctx.request.body)
      const { username, password } = ctx.request.body
      if (!username || !password) {
        ctx.status = 400
        ctx.body = { success: false, status:400, error: 'Username and password required' }
        return
      }
      const existing = await findUserByUsername(username)
      if (existing) {
        ctx.status = 409
        ctx.body = { success: false, status:409, error: 'Username already exists' }
        return
      }
      const hashedPassword = await bcrypt.hash(password, 10)
      const userId = await createUser(username, hashedPassword) // 修正
      const token = jwt.sign({ id: userId, username }, process.env.JWT_SECRET, { expiresIn: '7d' })
      ctx.body = { success: true,  status:200, token, user: { id: userId, username } } // 添加 success 字段
    } catch (err) {
      console.error('注册错误:', err)
      ctx.status = 500
      ctx.body = { success: false, status:500, error: err.message }
    }
  },

  async login(ctx) {
    try {
      console.log('登录请求体:', ctx.request.body)
      const { username, password } = ctx.request.body
      const user = await findUserByUsername(username)
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
      const token = jwt.sign({ id: user.id, username }, process.env.JWT_SECRET, { expiresIn: '7d' })
      ctx.body = { success: true, status:200, token, user: { id: user.id, username, nickname: user.nickname } }
    } catch (err) {
      console.error('登录错误:', err)
      ctx.status = 500
      ctx.body = { success: false, status:500, error: err.message }
    }
  }
}