const pool = require('../config/db');

async function getSessions(userId) {
  const sql = `
    SELECT 
      s.session_id,
      s.user_id,
      s.target_id,
      s.type,
      s.display,
      s.last_read_msg_id,
      u.nick_name AS target_name,
      u.avatar AS target_avatar,
      (SELECT COUNT(*) FROM messages m 
      WHERE m.session_id = s.session_id AND m.id > s.last_read_msg_id) AS unread_count,
      (SELECT MAX(m.created_at) FROM messages m 
      WHERE m.session_id = s.session_id) AS last_msg_time,
      (SELECT m.content FROM messages m 
      WHERE m.session_id = s.session_id 
      ORDER BY m.created_at DESC LIMIT 1) AS last_msg_content
    FROM sessions s
    LEFT JOIN users u ON s.target_id = u.id
    WHERE s.user_id = ? AND s.type = 0
    ORDER BY last_msg_time IS NULL, last_msg_time DESC;
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

async function updateLastReadMsg(userId, sessionId, msgId) {
  const sql = `
  UPDATE sessions 
    SET last_read_msg_id = ? 
  WHERE session_id = ? AND user_id = ?`;
  const [result] = await pool.query(sql, [msgId, sessionId, userId]);
  return result.affectedRows > 0;
}

module.exports = {
  createSession,
  getSessions,
  updateLastReadMsg
}