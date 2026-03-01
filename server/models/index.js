const pool = require('../config/db')

module.exports = {
  // 用户模型
  async findUserByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username])
    return rows[0]
  },
  async createUser(username, password, nickname) {
    const [result] = await pool.query(
      'INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)',
      [username, password, nickname]
    )
    return result.insertId
  },
  // 其他模型方法...
}