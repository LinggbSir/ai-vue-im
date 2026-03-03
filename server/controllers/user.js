const { searchUsers } = require('../models/user');

module.exports = {
  async searchUsers(ctx) {
    console.log('搜索陌生人请求体:', ctx.request.body)
    console.log('ctx.state:', ctx.state);
    const { keyword } = ctx.query;
    const currentUserId = ctx.state.user.id; // 从 JWT 获取当前用户ID
    if (!keyword || keyword.trim() === '') {
      ctx.body = { users: [] };
      return;
    }
    try {
      const users = await searchUsers(currentUserId, keyword.trim());
      ctx.body = { users };
    } catch (err) {
      console.error('搜索用户失败:', err);
      ctx.status = 500;
      ctx.body = { error: '服务器错误' };
    }
  }
}
