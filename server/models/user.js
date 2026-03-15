const pool = require('../config/db');

const getUserInfo = async (id) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id])
  return rows
}

const updateUserInfo = async (user) => {
  const { id, nick_name, gender, signature, email, region } = user;
  await pool.query(
    'UPDATE users SET nick_name = ?, gender = ?, signature = ?, email = ?, region = ? WHERE id = ?',
    [nick_name, gender, signature, email, region, id]
  );
}

const updateUserAvatar = async (id, avatar) => {
  await pool.query(
    'UPDATE users SET avatar = ? WHERE id = ?',
    [avatar, id]
  );
}

module.exports = {
  getUserInfo,
  updateUserInfo,
  updateUserAvatar
}
