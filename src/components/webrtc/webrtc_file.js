import { ref, onUnmounted } from 'vue';
import { getSocket } from '@/utils/socket';

export function useWebRTCFile(options = {}) {
  const {
    onRemoteStream,        // 收到远端流时的回调
    onCallConnected,        // 通话连接成功回调
    stunServers = ['stun:stun.l.google.com:19302'] // 默认STUN
  } = options;

  const socket = getSocket();
  const peerConnection = ref(null);
  const callStatus = ref('idle');
  const remoteUserId = ref(null)
  const pendingCandidates = ref([])

  // 创建RTCPeerConnection实例
  const createPeerConnection = () => {
    const configuration = {
      iceServers: stunServers.map(url => ({ urls: url }))
    };
    const pc = new RTCPeerConnection(configuration);

    // 监听ICE candidate，通过信令发给对方
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc-candidate', {
          to: remoteUserId.value,
          candidate: event.candidate
        });
      }
    };

    // 监听连接状态变化
    pc.onconnectionstatechange = () => {
      console.log('连接状态:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        callStatus.value = 'connected';
        console.log('连接成功', callStatus.value);
        onCallConnected?.();
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        callStatus.value = 'idle';
      }
    };
    pc.oniceconnectionstatechange = () => {
      console.log('ICE状态:', pc.iceConnectionState);
    };
    pc.onicecandidateerror = (event) => {
      console.error('ICE候选错误:', event.errorText, '地址:', event.url);
    };

    return pc;
  };

  const checkActiveCall = () => {
    const callStore = useCallStore()
    return callStore.activeCall?.remoteUserId === targetId.value
  }

  const checkIsOnline = () => {
      const onlineRes = await request.get(`/user/online/${targetId.value}`)
    return !onlineRes.online
  }

// 新建文件传输连接
const startFileTransfer = async (file) => {
  const pc = new RTCPeerConnection({ iceServers: [...] })
  const channel = pc.createDataChannel('file-transfer')
  setupSendChannel(channel, file)

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('webrtc-candidate', {
        targetUserId: targetId.value,
        candidate: event.candidate
      })
    }
  }

  // 创建offer
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  socket.emit('webrtc-offer', {
    targetUserId: targetId.value,
    sdp: offer.sdp,
    purpose: 'file'
  })

  // 等待answer（通过一次性Promise）
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('等待answer超时')), 30000)
    const answerHandler = (data) => {
      if (data.from === targetId.value) {
        clearTimeout(timeout)
        socket.off('webrtc-answer', answerHandler)
        pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }))
          .then(resolve)
          .catch(reject)
      }
    }
    socket.on('webrtc-answer', answerHandler)
  })
}

// 设置发送通道
const setupSendChannel = (channel, file) => {
  channel.onopen = () => {
    console.log('文件通道已打开，开始发送')
    sendFileViaDataChannel(channel, file) // 复用之前的分片发送逻辑
  }
  channel.onerror = (err) => console.error('通道错误', err)
}

// 接收文件（被叫方）
const handleFileOffer = async (data) => {
  const { from, offer } = data
  
  // 如果已存在文件传输连接，关闭旧的（简化处理，可支持并发）
  if (fileTransferPC.value) {
    fileTransferPC.value.close()
  }
  
  // 创建新的RTCPeerConnection
  const pc = createPeerConnection()
  fileTransferPC.value = pc

  // 设置ICE candidate转发
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('webrtc-candidate', {
        targetUserId: from,
        candidate: event.candidate
      })
    }
  }

  // 等待数据通道
  pc.ondatachannel = (event) => {
    console.log('收到文件数据通道', event.channel)
    setupFileReceiveChannel(event.channel) // 定义文件接收逻辑
  }

  // 设置远程描述
  await pc.setRemoteDescription({
    type: 'offer',
    sdp: offer
  })
  
  // 创建answer
  const answer = await pc.createAnswer()
  await pc.setLocalDescription(answer)
  
  // 发送answer
  socket.emit('webrtc-answer', {
    targetUserId: from,
    sdp: answer.sdp
  })
}

// 设置文件接收通道的事件
const setupFileReceiveChannel = (channel) => {
  const incomingFiles = {} // 存储接收中的文件
  channel.onmessage = (event) => {
    // 解析消息，处理文件分片（与之前实现的handleDataChannelMessage相同）
    // 可以复用之前写的逻辑
  }
}

  // 处理对方发来的answer
  const handleAnswer = async (data) => {
    const { from, answer } = data;
    if (!peerConnection.value) return;
    await peerConnection.value.setRemoteDescription({
      type: 'answer',
      sdp: answer
    });
  };

  // 处理对方发来的ICE candidate
  const handleCandidate = async (data) => {
    const { from, candidate } = data;
    if (!peerConnection.value) {
      console.log('peerConnection.value 不存在，缓存 ICE 候选');
      pendingCandidates.value.push(candidate);
      return;
    }
    try {
      await peerConnection.value.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('添加 ICE 候选失败', err);
    }
  };

  // 结束文件传输
  const endTransfer = () => {
    console.log('执行peerConnection关闭')
    if (peerConnection.value) {
      peerConnection.value.close();
      peerConnection.value = null;
    }
    callStatus.value = 'idle';
  };

  // 组件卸载时自动清理
  onUnmounted(() => {
    endCall();
  });

  return {
    localStream,
    remoteStream,
    callStatus,
    startCall,
    acceptCall,
    handleAnswer,
    handleCandidate,
    endCall
  };
}