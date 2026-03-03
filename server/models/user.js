// models/user.js
const pool = require('../config/db');

async function searchUsers(currentUserId, keyword) {
  // 搜索用户，排除当前用户、已好友关系用户、已被好友关系用户
  const sql = `
    SELECT u.id, u.username, u.avatar, u.signature
    FROM users u
    WHERE u.id != ? 
      AND (u.username LIKE ? OR u.signature LIKE ?)
      AND NOT EXISTS (
        SELECT 1 FROM friends f
        WHERE (f.user_id = ? AND f.friend_id = u.id AND f.status = 1)
           OR (f.user_id = u.id AND f.friend_id = ? AND f.status = 1)
      )
    LIMIT 50
  `;

  const [rows] = await pool.query(sql, [
    currentUserId,
    `%${keyword}%`,
    `%${keyword}%`,
    currentUserId,
    currentUserId
  ]);
  return rows;
}

module.exports = { searchUsers };