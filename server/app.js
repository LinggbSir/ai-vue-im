require('dotenv').config()

const Koa = require('koa')
const cors = require('@koa/cors')
const bodyParser = require('koa-bodyparser')
const http = require('http')
const static = require('koa-static')
const path = require('path')
const { Server } = require('socket.io')
const initSocket = require('./sockets')


const router = require('./routes')
router.prefix('/api')

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
// 配置静态文件服务中间件，将 uploads 目录设为静态目录
app.use(static(path.join(__dirname, './uploads')))

// 初始化 WebSocket 服务器
const { userSockets } = initSocket(io)

// 启动 HTTP 服务器
server.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`)
})
