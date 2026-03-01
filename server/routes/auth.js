const router = require('koa-router')
const authController = require('../controllers/auth')

const authRouter = router()

authRouter.post('/register', authController.register)
authRouter.post('/login', authController.login)

module.exports = authRouter
