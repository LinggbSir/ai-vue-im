const Router = require('koa-router')
const AuthController = require('../controllers/auth')
const UserController = require('../controllers/user')
const authMiddleware = require('../middlewares/auth'); // 引入中间件
const SessionController = require('../controllers/session'); // 引入会话控制器
const MessageController = require('../controllers/message'); // 引入消息控制器
const router = new Router()

// 认证相关路由
router.post('/register', AuthController.register)
router.post('/login', AuthController.login)

// 用户相关路由
router.get('/users/search', authMiddleware, UserController.searchUsers)
router.post('/users/contacts/add', authMiddleware, UserController.addFriend)
router.get('/users/contacts', authMiddleware, UserController.getContactList)
router.get('/users/contacts/requests', authMiddleware, UserController.getFriendRequests)
router.post('/users/contacts/accept', authMiddleware, UserController.acceptFriendRequest)
router.post('/users/contacts/reject', authMiddleware, UserController.rejectFriendRequest)
router.get('/users/:id', authMiddleware, UserController.getUserById)

// 会话相关路由
router.get('/sessions', authMiddleware, SessionController.getSessionList)

// 消息相关路由
router.get('/messages', authMiddleware, MessageController.getMessages)



module.exports = router

