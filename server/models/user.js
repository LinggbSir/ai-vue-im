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

async function addFriend(currentUserId, friendId) {
  // 检查是否已存在好友关系
  const checkSql = `
    SELECT 1 FROM friends
    WHERE user_id = ? AND friend_id = ?
  `;
  const [rows] = await pool.query(checkSql, [
    currentUserId, friendId
  ]);
  if (rows.length > 0) throw new Error('好友关系已存在');
  // 插入好友关系
  const insertSql = `
    INSERT INTO friends (user_id, friend_id, status)
    VALUES (?, ?, 0)
  `;
  await pool.query(insertSql, [currentUserId, friendId]);
}

async function getFriendList(currentUserId) {
  // 查询好友列表
  const sql = `
    SELECT u.id, u.username, u.avatar, u.signature
    FROM friends f
    JOIN users u ON f.friend_id = u.id
    WHERE f.user_id = ? AND f.status = 1
  `;
  const [rows] = await pool.query(sql, [currentUserId, currentUserId]);
  return rows;
}
async function getFriendRequests(currentUserId) {
  // 查询好友请求列表
  const sql = `
    SELECT u.id, u.username, u.avatar, u.signature
    FROM friends f
    JOIN users u ON f.user_id = u.id
    WHERE f.friend_id = ? AND f.status = 0
  `;
  const [rows] = await pool.query(sql, [currentUserId]);
  return rows;
}
async function acceptFriendRequest(currentUserId, friendId) {
  // 检查好友请求是否存在
  const checkSql = `
    SELECT 1 FROM friends
    WHERE user_id = ? AND friend_id = ? AND status = 0
  `;
  const [rows] = await pool.query(checkSql, [friendId, currentUserId]);
  if (rows.length === 0) throw new Error('好友请求不存在');
  // 更新好友关系状态
  const updateSql = `
    UPDATE friends
    SET status = 1
    WHERE user_id = ? AND friend_id = ?
  `;
  await pool.query(updateSql, [friendId, currentUserId]);
}
async function rejectFriendRequest(currentUserId, friendId) {
  // 检查好友请求是否存在
  const checkSql = `
    SELECT 1 FROM friends
    WHERE user_id = ? AND friend_id = ? AND status = 0
  `;
  const [rows] = await pool.query(checkSql, [friendId, currentUserId]);
  if (rows.length === 0) throw new Error('好友请求不存在');
  // 删除好友关系
  const deleteSql = `
    DELETE FROM friends
    WHERE user_id = ? AND friend_id = ?
  `;
  await pool.query(deleteSql, [friendId, currentUserId]);
}
async function findUserById(id) {
  const [rows] = await pool.query(
    'SELECT id, username, avatar, signature, email FROM users WHERE id = ?',
    [id]
  )
  return rows[0]
}

async function checkFriendship(user_id, friend_id) {
  const [rows] = await pool.query(
    'SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ? AND status = 1',
    [user_id, friend_id]
  )
  return rows.length > 0
}
async function createFriendship(friendship) {
  const { user_id, friend_id, status } = friendship;
  await pool.query(
    'INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = ?',
    [user_id, friend_id, status, status]
  );
}

module.exports = { 
  searchUsers,
   addFriend, 
   getFriendList, 
   getFriendRequests, 
   acceptFriendRequest, 
   rejectFriendRequest, 
   findUserById,
   checkFriendship,
   createFriendship
  };
