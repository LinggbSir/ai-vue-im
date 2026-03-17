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

        const message = {
          session_id: sessionId,
          sender_id: from,
          receiver_type: 0, // 0 表示用户
          receiver_id: to,
          content,
          type: 0, // 文本消息
          status: 1 // 发送成功
        }
        // 保存消息到数据库
        const messageId = await messageModel.saveMessage(message);

        // 将消息发送给接收方（如果在线）
        const targetSocketId = userSockets.get(to);
        if (targetSocketId) {
          io.to(targetSocketId).emit('private message', {id:messageId, ...message});
        } else {
          // 用户不在线，消息已存入数据库，下次上线可拉取离线消息
          console.log('用户不在线，消息已保存');
        }

        // 将消息也回传给发送方（确认送达）
        socket.emit('private message', {id:messageId, ...message});
      } catch (err) {
        console.error('发送消息失败:', err);
        socket.emit('error', '消息发送失败');
      }
    });

    socket.on('disconnect', () => {
      console.log('用户断开:', socket.userId);
      userSockets.delete(socket.userId);
    });
    socket.on('webrtc-offer', async (data) => {
      const { to, offer, type } = data; // to: 接收方用户ID, offer: SDP Offer
      const from = socket.userId;
      const offerValid = offer !== undefined
      console.log('接收 WebRTC Offer:', { from, to, type, offerValid });
      
      if (!to || !offer) return;

      try {
        // 将 Offer 发送给接收方（如果在线）
        const targetSocketId = userSockets.get(to);
        if (targetSocketId) {
          io.to(targetSocketId).emit('webrtc-offer', { from, offer, type });
        } else {
          // 用户不在线，Offer 已存入数据库，下次上线可拉取
          console.log('用户不在线，Offer 已保存');
        }
      } catch (err) {
        console.error('发送 WebRTC Offer 失败:', err);
        socket.emit('error', 'WebRTC Offer 发送失败');
      }
    });
    socket.on('webrtc-answer', async (data) => {
      const { to, answer } = data; // to: 接收方用户ID, answer: SDP Answer
      const from = socket.userId;
      const answerValid = answer !== undefined
      console.log('发送 WebRTC Answer:', { from, to, answerValid});
      if (!to || !answer) return;

      try {
        // 将 Answer 发送给接收方（如果在线）
        const targetSocketId = userSockets.get(to);
        if (targetSocketId) {
          io.to(targetSocketId).emit('webrtc-answer', { from, answer });
        } else {
          // 用户不在线，Answer 已存入数据库，下次上线可拉取
          console.log('用户不在线，Answer 已保存');
        }
      } catch (err) {
        console.error('发送 WebRTC Answer 失败:', err);
        socket.emit('error', 'WebRTC Answer 发送失败');
      }
    });
    socket.on('webrtc-candidate', async (data) => {
      const { to, candidate } = data; // to: 接收方用户ID, candidate: ICE Candidate
      const from = socket.userId;
      const candidateValid = candidate !== undefined
      console.log('接收 WebRTC Candidate:', { from, to, candidateValid });
      if (!to || !candidate) return;

      try {
        // 将 Candidate 发送给接收方（如果在线）
        const targetSocketId = userSockets.get(to);
        if (targetSocketId) {
          console.log('转发candidate:');
          io.to(targetSocketId).emit('webrtc-candidate', { from, candidate });
        } else {
          // 用户不在线，Candidate 已存入数据库，下次上线可拉取
          console.log('用户不在线，Candidate 已保存');
        }
      } catch (err) {
        console.error('发送 WebRTC Candidate 失败:', err);
        socket.emit('error', 'WebRTC Candidate 发送失败');
      }
    })
    socket.on('call-end', async (data) => {
      const { to } = data; // to: 接收方用户ID
      const from = socket.userId;
      console.log('接收 通话结束:', { from, to });
      if (!to) return;

      try {
        // 将 通话结束 发送给接收方（如果在线）
        const targetSocketId = userSockets.get(to);
        if (targetSocketId) {
          io.to(targetSocketId).emit('call-end', { from, to });
        } else {
          // 用户不在线， 通话结束 已存入数据库，下次上线可拉取
          console.log('用户不在线， 通话结束 已保存');
        }
      } catch (err) {
        console.error('发送 通话结束 失败:', err);
        socket.emit('error', ' 通话结束 发送失败');
      }
    })
  });
  return { userSockets };
};