const pool = require('../config/db')

module.exports = {
  // 用户模型
  async findUserByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username])
    return rows[0]
  },
  async createUser(username, hashedPassword) {
    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, hashedPassword]
    )
    return result.insertId
  },
  // 其他模型方法...
}