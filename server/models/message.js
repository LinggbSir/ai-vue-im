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
async function saveMessage(message) {
  const { session_id, sender_id, receiver_type, receiver_id, content, type, status, msg_type, file_id } = message;
  const [result] = await pool.query(
    `INSERT INTO messages 
     (session_id, sender_id, receiver_type, receiver_id, content, status, msg_type, file_id, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [session_id, sender_id, receiver_type, receiver_id, content, status, msg_type, file_id, new Date()]
  );
  return result.insertId;
}

async function getMessagesBySession(sessionId, beforeId, limit) {
  let sql, params;
  if (beforeId) {
    sql = `
      SELECT * FROM (
          SELECT 
            m.*, 
            f.url AS file_url, 
            f.name AS file_name, 
            f.size AS file_size, 
            f.mime_type AS file_mime, 
            f.thumbnail_url AS file_thumbnail,
            sender.avatar AS sender_avatar
          FROM messages m
          LEFT JOIN files f ON m.file_id = f.id
          LEFT JOIN users sender ON m.sender_id = sender.id
          WHERE m.session_id = ? AND m.id < ?
          ORDER BY m.id DESC
          LIMIT ?
      ) AS t ORDER BY t.id ASC;
    `;
    params = [sessionId, parseInt(beforeId), parseInt(limit)];
  } else {
    sql = `
      SELECT * FROM (
          SELECT 
            m.*, 
            f.url AS file_url, 
            f.name AS file_name, 
            f.size AS file_size, 
            f.mime_type AS file_mime, 
            f.thumbnail_url AS file_thumbnail,
            sender.avatar AS sender_avatar
          FROM messages m
          LEFT JOIN files f ON m.file_id = f.id
          LEFT JOIN users sender ON m.sender_id = sender.id
          WHERE m.session_id = ?
          ORDER BY m.id DESC
          LIMIT ?
      ) AS t ORDER BY t.id ASC;
    `;
    params = [sessionId, parseInt(limit)];
  }
  const [rows] = await pool.query(sql, params);
  const messages = rows.map(row => {
    const msg = { ...row };
    
    // 如果有文件（file_id 不为空），构造 fileInfo 对象
    if (row.file_id) {
      msg.fileInfo = {
        url: row.file_url,
        name: row.file_name,
        size: row.file_size,
        mimeType: row.file_mime,
        thumbnailUrl: row.file_thumbnail
      };
      
      delete msg.file_url;
      delete msg.file_name;
      delete msg.file_size;
      delete msg.file_mime;
      delete msg.file_thumbnail;
    }
    
    return msg;
  });
  return messages;
}


module.exports = {
  getLastMessage,
  saveMessage,
  getMessagesBySession
}