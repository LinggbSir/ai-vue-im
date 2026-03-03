const { 
  searchUsers, 
  addFriend, 
  getFriendList, 
  getFriendRequests, 
  acceptFriendRequest, 
  rejectFriendRequest,
  findUserById,
  checkFriendship,
  createFriendship
} = require('../models/user');
const { createSession } = require('../models/session');

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
  },
  async addFriend(ctx) {
    const { friendId } = ctx.request.body;
    const currentUserId = ctx.state.user.id; // 从 JWT 获取当前用户ID
    try {
      await addFriend(currentUserId, friendId);
      ctx.body = { success: true, message: '好友申请发送成功' };
    } catch (err) {
      console.error('添加好友失败:', err);
      ctx.status = 500;
      ctx.body = { success: false, error: '服务器错误' };
    }
  },
  async getFriendList(ctx) {
    const currentUserId = ctx.state.user.id; // 从 JWT 获取当前用户ID
    try {
      const friendList = await getFriendList(currentUserId);
      ctx.body = { success: true, friendList };
    } catch (err) {
      console.error('获取好友列表失败:', err);
      ctx.status = 500;
      ctx.body = { success: false, error: '服务器错误' };
    }
  },
  async getFriendRequests(ctx) {
    const currentUserId = ctx.state.user.id; // 从 JWT 获取当前用户ID
    try {
      const friendRequests = await getFriendRequests(currentUserId);
      ctx.body = { success: true, friendRequests };
    } catch (err) {
      console.error('获取好友请求列表失败:', err);
      ctx.status = 500;
      ctx.body = { success: false, error: '服务器错误' };
    }
  },
  async acceptFriendRequest(ctx) {
    const { requestId } = ctx.request.body;
    const currentUserId = ctx.state.user.id; // 从 JWT 获取当前用户ID
    try {
      await acceptFriendRequest(currentUserId, requestId);
      ctx.body = { success: true, message: '好友申请已同意' };
      await createFriendship({
        user_id: currentUserId,
        friend_id: requestId,
        status: 1
      });
      //同意好友申请后，创建会话
      await Promise.all([
        createSession(userId, friendId),   // B 的会话
        createSession(friendId, userId)    // A 的会话
      ]);
    } catch (err) {
      console.error('同意好友申请失败:', err);
      ctx.status = 500;
      ctx.body = { success: false, error: '服务器错误' };
    }
  },
  async rejectFriendRequest(ctx) {
    const { requestId } = ctx.request.body;
    const currentUserId = ctx.state.user.id; // 从 JWT 获取当前用户ID
    try {
      await rejectFriendRequest(currentUserId, requestId);
      ctx.body = { success: true, message: '好友申请已拒绝' };
    } catch (err) {
      console.error('拒绝好友申请失败:', err);
      ctx.status = 500;
        ctx.body = { success: false, error: '服务器错误' };
      }
  },
  async getUserById(ctx) {
    const { id } = ctx.params
    const currentUserId = ctx.state.user.id
    if (!id) {
      ctx.status = 400
      ctx.body = { error: '缺少用户ID' }
      return
    }
    try {
      const user = await findUserById(id)
      if (!user) {
        ctx.status = 404
        ctx.body = { error: '用户不存在' }
        return
      }
      // 可选：检查是否是好友关系（用于前端显示不同状态）
      const isFriend = await checkFriendship(currentUserId, id) // 需要实现该函数
      ctx.body = {
        success: true,
        data: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          signature: user.signature,
          email: user.email,
          isFriend: isFriend
        }
      }
    } catch (err) {
      console.error(err)
      ctx.status = 500
      ctx.body = { error: '服务器错误' }
    }
  }
}

