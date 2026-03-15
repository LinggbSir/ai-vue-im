const pool = require('../config/db')

module.exports = {
  // 用户模型
  async findUserByUsername(echo_id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE echo_id = ?', [echo_id])
    return rows[0]
  },
  async createUser(echo_id, nickName, hashedPassword) {
    const [result] = await pool.query(
      'INSERT INTO users (echo_id, nick_name, password_hash) VALUES (?, ?, ?)',
      [echo_id, nickName, hashedPassword]
    )
    return result.insertId
  },
  // 其他模型方法...
}