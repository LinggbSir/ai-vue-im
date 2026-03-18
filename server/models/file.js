const pool = require('../config/db');

const uploadFile = async (file) => {
  const { user_id, url, name, size, mime_type, thumbnail_url } = file;
  const [result] = await pool.query(
    `INSERT INTO files (user_id, url, name, size, mime_type, thumbnail_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [user_id, url, name, size, mime_type, thumbnail_url]
  );
  return result.insertId;
};

const getFileInfo = async (fileId) => {
  const [rows] = await pool.query(
    `SELECT id, user_id, url, thumbnail_url, name, size, mime_type, created_at FROM files WHERE id = ?`,
    [fileId]
  );
  return rows[0];
};

module.exports = {
  uploadFile,
  getFileInfo
};
