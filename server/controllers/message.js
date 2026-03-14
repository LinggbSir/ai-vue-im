const messageModel = require('../models/message');

async function getMessages(ctx) {
  const { sessionId, beforeId, limit } = ctx.query
  try {
    console.log('获取会话消息:', sessionId, beforeId, limit)
    console.log(ctx.query)
    const messages = await messageModel.getMessagesBySession(sessionId, beforeId, limit)
    const hasMore = messages.length === parseInt(limit)
    ctx.body = { success: true, messages, hasMore }
  } catch (err) {
    console.error('获取会话消息失败:', err);
    ctx.status = 500;
    ctx.body = { success: false, error: '服务器错误' };
  }
}

module.exports = {
  getMessages
}