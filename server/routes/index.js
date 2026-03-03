const Router = require('koa-router')
const AuthController = require('../controllers/auth')
const UserController = require('../controllers/user')
const authMiddleware = require('../middlewares/auth'); // 引入中间件
const router = new Router()

// 认证相关路由
router.post('/register', AuthController.register)
router.post('/login', AuthController.login)

// 用户相关路由
router.get('/users/search', authMiddleware, UserController.searchUsers)

module.exports = router

