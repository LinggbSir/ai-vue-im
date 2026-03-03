const pool = require('../config/db');

async function getSessions(userId) {
  const sql = `
    SELECT s.id, s.target_id, s.type, s.display, s.last_msg_time,
           u.username, u.avatar, u.signature
    FROM sessions s
    JOIN users u ON s.target_id = u.id
    WHERE s.user_id = ?
  `;
  const [rows] = await pool.query(sql, [userId]);
  return rows;
}

async function createSession(userId, targetId) {
  const sql = `
    INSERT INTO sessions (user_id, target_id, type, display, last_msg_time)
    VALUES (?, ?, 0, TRUE, NULL)
    ON DUPLICATE KEY UPDATE display = TRUE  -- 确保会话可见（可能之前被隐藏）
  `;
  await pool.query(sql, [userId, targetId]);
};

module.exports = {
  createSession,
  getSessions
}