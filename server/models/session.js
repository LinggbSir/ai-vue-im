const pool = require('../config/db');

async function getSessions(userId) {
  const sql = `
    SELECT session_id, user_id, type, display, last_msg_time, last_read_msg_id
    FROM sessions
    WHERE user_id = ?
  `;
  const [rows] = await pool.query(sql, [userId]);
  return rows;
}

async function createSession(userId, targetId) {
  const sql = `
    INSERT INTO sessions (session_id, user_id, target_id, type, display, last_msg_time)
    VALUES (?, ?, ?, 0, TRUE, NULL)
    ON DUPLICATE KEY UPDATE display = TRUE  -- 确保会话可见（可能之前被隐藏）
  `;
  const sessionId = [userId, targetId].sort().join('_');
  await pool.query(sql, [sessionId, userId, targetId]);
};

module.exports = {
  createSession,
  getSessions
}