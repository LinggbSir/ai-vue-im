const pool = require('../config/db');

const getLastMessage = async (sessionId) => {
  const sql = `
    SELECT content, created_at
    FROM messages
    WHERE session_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const [rows] = await pool.query(sql, [sessionId]);
  return rows[0];
}
