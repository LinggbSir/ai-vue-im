const Router = require('koa-router')
const authMiddleware = require('../middlewares/auth'); // 引入中间件
const AuthController = require('../controllers/auth')
const userController = require('../controllers/user')
const contactController = require('../controllers/contact')
const SessionController = require('../controllers/session'); // 引入会话控制器
const MessageController = require('../controllers/message'); // 引入消息控制器
const router = new Router()

// 认证相关路由
router.post('/register', AuthController.register)
router.post('/login', AuthController.login)

// 获取用户信息
router.get('/user', authMiddleware, userController.getUserInfo)
router.put('/user/profile', authMiddleware, userController.updateUserInfo)
// 联系人相关路由
router.get('/users/search', authMiddleware, contactController.searchUsers)
router.post('/users/contacts/add', authMiddleware, contactController.addFriend)
router.get('/users/contacts', authMiddleware, contactController.getContactList)
router.get('/users/contacts/requests', authMiddleware, contactController.getFriendRequests)
router.post('/users/contacts/accept', authMiddleware, contactController.acceptFriendRequest)
router.post('/users/contacts/reject', authMiddleware, contactController.rejectFriendRequest)
router.get('/users/:id', authMiddleware, contactController.getUserById)

// 会话相关路由
router.get('/sessions', authMiddleware, SessionController.getSessionList)

// 消息相关路由
router.get('/messages', authMiddleware, MessageController.getMessages)



module.exports = router

