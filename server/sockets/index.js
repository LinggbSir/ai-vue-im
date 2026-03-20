const messageModel = require('../models/message'); 
const fileModel = require('../models/file');
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
      const { to, content, msgType = 0, fileId, tempId } = data; // 扩展参数
      const from = socket.userId;
      console.log('发送私聊消息:', { from, to, content, msgType, fileId });
      if (!to || !content) return;

      try {
        const sessionId = [from, to].sort().join('_');

        let fileInfo = null;
        // 如果是文件消息，获取文件信息
        if (msgType === 1 && fileId) {
          fileInfo = await fileModel.getFileInfo(fileId);
          console.log('fileInfo', fileInfo);
          if (!fileInfo) {
            console.error('文件不存在', fileId);
            return;
          }
        }

        // 构建消息对象（包含新字段）
        const message = {
          session_id: sessionId,
          sender_id: from,
          receiver_type: 0,
          receiver_id: to,
          content,
          status: 1,
          msg_type: msgType,      // 新增：0-文本，1-文件
          file_id: fileId || null // 新增：关联文件ID
        };

        // 保存消息到数据库（需确保 messageModel.saveMessage 已适配新字段）
        const messageId = await messageModel.saveMessage(message);

        // 构造要推送的消息对象（包含文件信息）
        const pushMsg = {
          id: messageId,
          session_id: sessionId,
          sender_id: from,
          receiver_type: 0,
          receiver_id: to,
          content,
          status: 1,
          msg_type: msgType,      // 新增：0-文本，1-文件
          file_id: fileId || null, // 新增：关联文件ID
          fileInfo: {}
        };
        pushMsg.fileInfo.url = fileInfo?.url || null;
        pushMsg.fileInfo.thumbnailUrl = fileInfo?.thumbnail_url || null;
        pushMsg.fileInfo.name = fileInfo?.name || null;
        pushMsg.fileInfo.size = fileInfo?.size || null;
        pushMsg.fileInfo.mimeType = fileInfo?.mime_type || null;
        console.log('pushMsg', pushMsg);
        // 发送给接收方
        const targetSocketId = userSockets.get(to);
        if (targetSocketId) {
          io.to(targetSocketId).emit('private message', pushMsg);
        } else {
          console.log('用户不在线，消息已保存');
        }
        pushMsg.temp_id = tempId; // 原样返回
        // 回传给发送方
        socket.emit('private message', pushMsg);
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
    socket.on('webrtc-offer-file', async (data) => {
      const { to, offer } = data; // to: 接收方用户ID, offer: SDP Offer
      const from = socket.userId;
      const offerValid = offer !== undefined
      console.log('接收 WebRTC Offer-file:', { from, to, offerValid });
      
      if (!to || !offer) return;

      try {
        // 将 Offer 发送给接收方（如果在线）
        const targetSocketId = userSockets.get(to);
        if (targetSocketId) {
          console.log('转发offer-file:');
          io.to(targetSocketId).emit('webrtc-offer-file', { from, offer });
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