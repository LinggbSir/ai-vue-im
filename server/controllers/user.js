const userModel = require('../models/user')

const getUserInfo = async (ctx) => {
  const id = ctx.state.user.id
  const user = await userModel.getUserInfo(id)
  ctx.body = { success: true, user }
}

const updateUserInfo = async (ctx) => {
  const id = ctx.state.user.id
  const { nick_name, gender, signature, email, region } = ctx.request.body;
  console.log('更新请求体', ctx.request.body)
  try {
    await userModel.updateUserInfo({
      id,
      nick_name,
      gender,
      signature,
      email,
      region,
    });
    ctx.body = { success: true, message: '用户信息更新成功' };
  } catch (err) {
    console.log('更新用户信息失败：', err)
    ctx.status = 500;
    ctx.body = { success: false, error: '服务器错误' };
  }
}
const updateUserAvatar = async (ctx) => {
  const file = ctx.file // 由 upload 中间件挂载到 ctx 上
  if (!file) {
    ctx.status = 400
    ctx.body = { error: '请选择文件' }
    return
  }
  try {
    // 生成可访问的 URL（假设后端静态服务）
    const baseUrl = process.env.BASE_URL
    const avatarUrl = `${baseUrl}/avatar/${file.filename}`

    // 更新数据库（示例）
    const userId = ctx.state.user.id
    await userModel.updateUserAvatar(userId, avatarUrl) // 需要你实现

    ctx.body = {
      success: true,
      data: { avatarUrl }
  }
  } catch (err) {
    console.log('更新用户头像失败：', err)
    ctx.status = 500;
    ctx.body = { success: false, error: '服务器错误' };
  }
}

const getMediaFiles = async (ctx) => {
  const id = ctx.state.user.id
  const photos = await userModel.getMediaFiles(id)
  ctx.body = { success: true, data: photos }
}

const getFiles = async (ctx) => {
  const id = ctx.state.user.id
  const files = await userModel.getFiles(id)
  ctx.body = { success: true, data: files }
}

const getMessageCount = async (ctx) => {
  const id = ctx.state.user.id
  const count = await userModel.getMessageCount(id)
  ctx.body = { success: true, data: count }
}

module.exports = {
  getUserInfo,
  updateUserInfo,
  updateUserAvatar,
  getMediaFiles,
  getFiles,
  getMessageCount
}
