const multer = require('@koa/multer')
const path = require('path')
const fs = require('fs')

// 确保上传目录存在
const uploadDirAvatar = path.join(__dirname, '../uploads/avatar')
if (!fs.existsSync(uploadDirAvatar)) {
  fs.mkdirSync(uploadDirAvatar, { recursive: true })
}

const uploadDirFile = path.join(__dirname, '../uploads/file')
if (!fs.existsSync(uploadDirFile)) {
  fs.mkdirSync(uploadDirFile, { recursive: true })
}

const uploadDirThumb = path.join(__dirname, '../uploads/thumb'); // 新增：缩略图目录

// 配置存储
const storageAvatar = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirAvatar)
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, `${unique}${ext}`)
  }
})

const storageFile = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirFile)
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, `${unique}${ext}`)
  }
})

const fileFilter = (req, file, callback) => {
  // 将乱码的文件名重新解码为正确的中文
  // 核心逻辑：先按 latin1 转成字节，再按 utf8 解析成字符串 [citation:5][citation:6][citation:9]
  file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8')
  callback(null, true)
}

const uploadAvatar = multer({ storage: storageAvatar, fileFilter })
const uploadFile = multer({ storage: storageFile, fileFilter })

// 导出两个中间件
module.exports = {
  uploadDirThumb, // 新增：导出缩略图目录
  uploadAvatar: uploadAvatar.single('avatar'), // 用于头像上传，字段名为 'avatar'
  uploadFile: uploadFile.single('file')      // 用于普通文件上传，字段名为 'file'
};