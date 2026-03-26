const sessionModel = require('../models/session');

const getSessionList = async (ctx) => {
  const userId = ctx.state.user.id;
  try {
    const sessions = await sessionModel.getSessions(userId);
    ctx.body = { success: true, sessions };
  } catch (err) {
    console.error('获取会话列表失败:', err);
    ctx.status = 500;
    ctx.body = { success: false, error: '服务器错误' };
  }
}

const updateLastReadMsg = async (ctx) => {
  const userId = ctx.state.user.id;
  const { sessionId } = ctx.params;
  const { lastReadMsgId } = ctx.request.body;
    // 参数校验
  if (!sessionId || lastReadMsgId === undefined) {
    ctx.status = 400;
    ctx.body = { error: '参数不完整' };
    return;
  }
  try {
    const success = await sessionModel.updateLastReadMsg(userId, sessionId, lastReadMsgId);
    ctx.body = { success, message: success ? '最后读取消息ID更新成功' : '更新失败' };
  } catch (err) {
    console.error('更新最后读取消息ID失败:', err);
    ctx.status = 500;
    ctx.body = { success: false, error: '服务器错误' };

    
  }
}

module.exports = {
  getSessionList,
  updateLastReadMsg
}