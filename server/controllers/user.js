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

module.exports = {
  getUserInfo,
  updateUserInfo
}
