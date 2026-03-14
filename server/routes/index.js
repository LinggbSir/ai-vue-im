const Router = require('koa-router')
const AuthController = require('../controllers/auth')
const UserController = require('../controllers/user')
const authMiddleware = require('../middlewares/auth'); // 引入中间件
const SessionController = require('../controllers/session'); // 引入会话控制器
const router = new Router()

// 认证相关路由
router.post('/register', AuthController.register)
router.post('/login', AuthController.login)

// 用户相关路由
router.get('/users/search', authMiddleware, UserController.searchUsers)
router.post('/users/friends/add', authMiddleware, UserController.addFriend)
router.get('/users/friends', authMiddleware, UserController.getFriendList)
router.get('/users/friends/requests', authMiddleware, UserController.getFriendRequests)
router.post('/users/friends/accept', authMiddleware, UserController.acceptFriendRequest)
router.post('/users/friends/reject', authMiddleware, UserController.rejectFriendRequest)
router.get('/users/:id', authMiddleware, UserController.getUserById)

// 会话相关路由
router.get('/sessions', authMiddleware, SessionController.getSessionList)

module.exports = router

