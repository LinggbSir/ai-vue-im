const pool = require('../config/db');
const { get } = require('../routes');

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

const getMediaFiles = async (id) => {
  const sql = `
    SELECT m.id, m.content, m.created_at, m.file_id, f.url, f.name, f.size, f.mime_type, f.thumbnail_url
    FROM messages m
    LEFT JOIN files f ON m.file_id = f.id
    WHERE (m.sender_id = ? OR m.receiver_id = ?)
      AND m.msg_type = 1
      AND (f.mime_type LIKE 'image/%' OR f.mime_type LIKE 'video/%')
    ORDER BY m.created_at DESC
  `;
  const [rows] = await pool.query(sql, [id, id]);
  return rows
}

const getFiles = async (id) => {
  const sql = `
    SELECT 
      f.id,
      f.url,
      f.thumbnail_url,
      f.name,
      f.size,
      f.mime_type,
      f.created_at,
      m.sender_id,
      u_sender.nick_name AS sender_name,
      CONCAT('与', u_receiver.nick_name, '的聊天') AS chat_with
    FROM files f
    JOIN messages m ON f.id = m.file_id
    LEFT JOIN users u_sender ON m.sender_id = u_sender.id
    LEFT JOIN users u_receiver ON m.receiver_type = 0 AND m.receiver_id = u_receiver.id
    WHERE (m.sender_id = ? OR m.receiver_id = ?)
      AND f.mime_type NOT LIKE 'image/%' AND f.mime_type NOT LIKE 'video/%'
    ORDER BY m.created_at DESC
  `;
  const [rows] = await pool.query(sql, [id, id]);
  return rows
}

const getMessageCount = async (id) => {
  const sql = `SELECT COUNT(*) AS total FROM messages WHERE sender_id = ? AND status = 1`; 
  const [rows] = await pool.query(sql, [id]);
  return rows[0].total
}

module.exports = {
  getUserInfo,
  updateUserInfo,
  updateUserAvatar,
  getMediaFiles,
  getFiles,
  getMessageCount
}
