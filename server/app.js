const Koa = require('koa')
const cors = require('@koa/cors')
const bodyParser = require('koa-bodyparser')
const jwt = require('jsonwebtoken')
const http = require('http')
const { Server } = require('socket.io')
require('dotenv').config()

const router = require('./routes')

// 初始化 Koa 应用，创建 HTTP 服务器和 Socket.IO 实例
const app = new Koa()
const server = http.createServer(app.callback())
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173', // 前端地址
    methods: ['GET', 'POST']
  }
})
// 配置 CORS 中间件，解析请求体中间件，路由中间件
app.use(cors())
app.use(bodyParser())
app.use(router.routes()).use(router.allowedMethods())

// 启动 HTTP 服务器
server.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`)
})
