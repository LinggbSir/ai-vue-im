const pool = require('../config/db');

async function getLastMessage(sessionId) {
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
async function saveMessage({ session_id, sender_id, receiver_type, receiver_id, content, type = 0 }) {
  const [result] = await pool.query(
    `INSERT INTO messages (session_id, sender_id, receiver_type, receiver_id, content, type, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
    [session_id, sender_id, receiver_type, receiver_id, content, type]
  );
  return result.insertId;
}

async function getMessagesBySession(sessionId, beforeId, limit) {
  let sql, params
  if (beforeId) {
    sql = `
      SELECT * FROM (
          SELECT * FROM messages 
          WHERE session_id = ? AND id < ? 
          ORDER BY id DESC 
          LIMIT ?
      ) AS t ORDER BY id ASC;
    `;
    params = [sessionId, parseInt(beforeId), parseInt(limit)]
  } else {
    sql = `
      SELECT * FROM (
          SELECT * FROM messages 
          WHERE session_id = ? 
          ORDER BY id DESC 
          LIMIT ?
      ) AS t ORDER BY id ASC;
    `;
    params = [sessionId, parseInt(limit)]
  }
  console.log(sql, params)
  const [rows] = await pool.query(sql, params);
  return rows;
}


module.exports = {
  getLastMessage,
  saveMessage,
  getMessagesBySession
}