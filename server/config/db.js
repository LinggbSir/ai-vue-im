const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host: process.env.DB_HOST, // 数据库主机地址
  user: process.env.DB_USER, // 数据库EID
  password: process.env.DB_PASSWORD, // 数据库密码
  database: process.env.DB_DATABASE, // 数据库名称
  waitForConnections: true, // 等待连接池中的连接
  connectionLimit: 10, // 最大连接数
  queueLimit: 0 // 0 表示无限制
})

module.exports = pool