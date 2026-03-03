const { getSessions } = require('../models/session');

const getSessionList = async (ctx) => {
  const userId = ctx.state.user.id;
  try {
    const sessions = await getSessions(userId);
    ctx.body = { success: true, sessions };
  } catch (err) {
    console.error('获取会话列表失败:', err);
    ctx.status = 500;
    ctx.body = { success: false, error: '服务器错误' };
  }
}

module.exports = {
  getSessionList
}