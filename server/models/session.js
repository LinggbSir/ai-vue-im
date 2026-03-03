const pool = require('../db');

async function createSession(userId, targetId) {
  const sql = `
    INSERT INTO sessions (user_id, target_id, type, show, last_msg_time)
    VALUES (?, ?, 0, TRUE, NULL)
    ON DUPLICATE KEY UPDATE show = TRUE  -- 确保会话可见（可能之前被隐藏）
  `;
  await pool.query(sql, [userId, targetId]);
};

module.exports = {
  createSession
}