const messageModel = require('../models/message'); 
const jwt = require('jsonwebtoken');

module.exports = (io) => {
  // 存储在线用户 socketId 与 userId 的映射（已在之前的代码中）
  const userSockets = new Map();

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Authentication error'));
      socket.userId = decoded.id;
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log('用户连接:', socket.userId);
    userSockets.set(socket.userId, socket.id);

    // 监听私聊消息
    socket.on('private message', async (data) => {
      const { to, content } = data; // to: 接收方用户ID, content: 消息内容
      const from = socket.userId;
      console.log('发送私聊消息:', { from, to, content });
      if (!to || !content) return;

      try {
        // 生成会话ID（例如用两个ID排序后拼接）
        const sessionId = [from, to].sort().join('_'); // 例如 "123_456"

        // 保存消息到数据库
        const messageId = await messageModel.saveMessage({
          session_id: sessionId,
          sender_id: from,
          receiver_type: 0, // 0 表示用户
          receiver_id: to,
          content,
          type: 0, // 文本消息
          status: 1 // 发送成功
        });

        // 构造要发送的消息对象
        const message = {
          id: messageId,
          from,
          to,
          content,
          sessionId,
          createdAt: Date.now()
        };

        // 将消息发送给接收方（如果在线）
        const targetSocketId = userSockets.get(to);
        if (targetSocketId) {
          io.to(targetSocketId).emit('private message', message);
        } else {
          // 用户不在线，消息已存入数据库，下次上线可拉取离线消息
          console.log('用户不在线，消息已保存');
        }

        // 将消息也回传给发送方（确认送达）
        socket.emit('private message', message);
      } catch (err) {
        console.error('发送消息失败:', err);
        socket.emit('error', '消息发送失败');
      }
    });

    socket.on('disconnect', () => {
      console.log('用户断开:', socket.userId);
      userSockets.delete(socket.userId);
    });
  });
  return { userSockets };
};