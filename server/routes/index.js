const Router = require('koa-router')
const AuthController = require('../controllers/auth')
const router = new Router()

router.post('/register', AuthController.register)
router.post('/login', AuthController.login)

module.exports = router

