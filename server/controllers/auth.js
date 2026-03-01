const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs') // 需要安装: npm install bcryptjs
const { findUserByUsername, createUser } = require('../models')

module.exports = {
  async register(ctx) {
    console.log('注册请求体:', ctx.request.body)
    const { username, password, nickname } = ctx.request.body
    if (!username || !password) {
      ctx.status = 400
      ctx.body = { error: 'Username and password required' }
      return
    }
    const existing = await findUserByUsername(username)
    if (existing) {
      ctx.status = 409
      ctx.body = { error: 'Username already exists' }
      return
    }
    // 密码哈希
    const hashedPassword = await bcrypt.hash(password, 10)
    // 创建用户
    const userId = await createUser(username, hashedPassword, nickname || username)
    // 注册成功，返回 JWT 令牌
    const token = jwt.sign({ id: userId, username }, process.env.JWT_SECRET, { expiresIn: '7d' })
    ctx.body = { token, user: { id: userId, username, nickname } }
  },

  async login(ctx) {
    console.log('登录请求体:', ctx.request.body)
    const { username, password } = ctx.request.body
    const user = await findUserByUsername(username)
    if (!user) {
      ctx.status = 401
      ctx.body = { error: 'Invalid credentials' }
      return
    }
    // 密码验证
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      ctx.status = 401
      ctx.body = { error: 'Invalid credentials' }
      return
    }
    // 登录成功，返回 JWT 令牌
    const token = jwt.sign({ id: user.id, username }, process.env.JWT_SECRET, { expiresIn: '7d' })
    ctx.body = { token, user: { id: user.id, username, nickname: user.nickname } }
  }
}