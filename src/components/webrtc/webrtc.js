import { ref, onUnmounted } from 'vue';
import { getSocket } from '@/utils/socket';

export function useWebRTCCall(options = {}) {
  const {
    onRemoteStream,        // 收到远端流时的回调
    onCallConnected,        // 通话连接成功回调
    stunServers = ['stun:stun.l.google.com:19302'] // 默认STUN
  } = options;

  const socket = getSocket();
  const peerConnection = ref(null);
  const localStream = ref(null);
  const remoteStream = ref(null);
  const callStatus = ref('idle'); // idle, calling, connecting, connected
  const remoteUserId = ref(null)
  const pendingCandidates = ref([])
  const dataChannel = ref(null)
  const incomingFiles = ref({}) // 用于存储接收中的文件信息
  const fileTransferProgress = ref(0) // 可选：当前文件传输进度（0-100）

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

    pc.ondatachannel = (event) => {
      console.log('收到数据通道', event.channel.label)
      setupDataChannel(event.channel)
    }

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

    

    // 监听远端流，触发回调
    pc.ontrack = (event) => {
      remoteStream.value = event.streams[0];
      onRemoteStream?.(remoteStream.value);
      console.log('收到远端流，轨道数:', event.streams[0].getTracks());
    };
    window.pc = pc;

    return pc;
  };

  // 发起通话（主叫方）
  const startCall = async (callerId, type = 'audio') => {
    if (!socket) return;
    remoteUserId.value = parseInt(callerId)

    // 获取本地音视频流
    try {
      localStream.value = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });
    } catch (err) {
      console.error('获取媒体流失败:', err);
      return;
    }

    // 创建PeerConnection
    peerConnection.value = createPeerConnection();

    // 添加本地轨道到连接中
    localStream.value.getTracks().forEach(track => {
      peerConnection.value.addTrack(track, localStream.value);
    });

    // 创建offer
    try {
      const offer = await peerConnection.value.createOffer();
      console.log(offer)
      await peerConnection.value.setLocalDescription(offer);
      socket.emit('webrtc-offer', {
        to: remoteUserId.value,
        offer: offer.sdp,
        type
      });
      callStatus.value = 'calling';
    } catch (err) {
      console.error('创建offer失败:', err);
    }
  };

  // 接听通话（被叫方）
  const acceptCall = async (callerId, offerSdp, type = 'audio') => {
    remoteUserId.value = parseInt(callerId)
    // 同样需要本地流
    try {
      localStream.value = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });
    } catch (err) {
      console.error('获取媒体流失败:', err);
      return;
    }
    peerConnection.value = createPeerConnection();
    localStream.value.getTracks().forEach(track => {
      peerConnection.value.addTrack(track, localStream.value);
    });
    handleOffer(offer)
  };

  const handleOffer = async (offer) => {
    console.log('handleOffer', offer)
    if (!peerConnection.value) return;
    await peerConnection.value.setRemoteDescription({
      type: 'offer',
      sdp: offer
    });

    // 处理缓存的 candidate
    await addPendingCandidate()
        // 创建answer
    try {
      const answer = await peerConnection.value.createAnswer();
      await peerConnection.value.setLocalDescription(answer);

      socket.emit('webrtc-answer', {
        to: remoteUserId.value,
        answer: answer.sdp
      });
      callStatus.value = 'connecting';
    } catch (err) {
      console.error('创建answer失败:', err);
    }
  }

  const addPendingCandidate = async () => {
    // 处理缓存的 candidate
    for (const candidate of pendingCandidates.value) {
      try {
        await peerConnection.value.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('添加缓存的 ICE 候选失败', err);
      }
    }
    pendingCandidates.value = []; 
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
      await peerConnection.value.addIceCandidate(candidate);
    } catch (err) {
      console.error('添加 ICE 候选失败', err);
    }
  };

  // 挂断通话
  const endCall = () => {
    console.log('执行peerConnection关闭')
    if (peerConnection.value) {
      peerConnection.value.close();
      peerConnection.value = null;
    }
    if (localStream.value) {
      localStream.value.getTracks().forEach(track => track.stop());
      localStream.value = null;
    }
    remoteStream.value = null;
    callStatus.value = 'idle';
  };

  // 组件卸载时自动清理
  onUnmounted(() => {
    endCall();
  });

  // 当连接成功时，可以创建数据通道（由发送方调用）
  const createFileChannel = (channelName = 'file-transfer') => {
    if (!peerConnection.value) return
    const channel = peerConnection.value.createDataChannel(channelName, {
      ordered: true,            // 保证数据顺序
      maxRetransmits: 3,        // 最多重传3次，避免无限重传导致堆积
    })
    setupDataChannel(channel)
    return channel
  }

  // 设置数据通道监听
  const setupDataChannel = (channel) => {
    dataChannel.value = channel

    channel.onopen = () => {
      console.log('数据通道已打开')
    }
    channel.onclose = () => {
      console.log('数据通道已关闭')
      dataChannel.value = null
    }

    channel.onmessage = (event) => {
      // 收到消息，可能是文件元信息或分片
      handleDataChannelMessage(event.data)
    }
  }

  // 处理数据通道消息
  const handleDataChannelMessage = (data) => {
    // 我们约定消息是JSON字符串，包含type字段
    let message
    try {
      message = JSON.parse(data)
    } catch (e) {
      console.warn('收到非JSON消息，忽略', data)
      return
    }

    if (message.type === 'file-meta') {
      // 文件元信息：文件名、大小、总分片数、MIME类型
      incomingFiles.value[message.fileId] = {
        id: message.fileId,
        name: message.name,
        size: message.size,
        mimeType: message.mimeType,
        totalChunks: message.totalChunks,
        receivedChunks: 0,
        chunks: [], // 用数组存储每个分片的ArrayBuffer
      }
      console.log('开始接收文件:', message.name)
    } 
    else if (message.type === 'file-chunk') {
      // 文件分片数据
      const fileInfo = incomingFiles.value[message.fileId]
      if (!fileInfo) return

      // 将base64数据还原为ArrayBuffer
      const binary = atob(message.data)
      const len = binary.length
      const bytes = new Uint8Array(len)
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      fileInfo.chunks[message.index] = bytes.buffer
      fileInfo.receivedChunks++

      // 更新进度（可选）
      fileTransferProgress.value = (fileInfo.receivedChunks / fileInfo.totalChunks) * 100
      console.log('已接收分片:', fileInfo.receivedChunks, '共', fileInfo.totalChunks)
      // 如果所有分片都收到了，触发合并下载
      if (fileInfo.receivedChunks === fileInfo.totalChunks) {
        assembleFile(fileInfo)
        delete incomingFiles.value[message.fileId]
        fileTransferProgress.value = 0
        endFileTransfer()
        socket.emit('webrtc-file-transfer-end', {
          to: remoteUserId.value,
        })
      }
    }
  }

  // 合并文件并触发下载
  const assembleFile = (fileInfo) => {
    // 合并所有ArrayBuffer
    const blob = new Blob(fileInfo.chunks, { type: fileInfo.mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileInfo.name
    a.click()
    URL.revokeObjectURL(url)
    console.log('文件已保存:', fileInfo.name)
  }

  // 发送文件（对外暴露的方法）
  const sendFile = async (targetId, file) => {
    remoteUserId.value = targetId
    peerConnection.value = createPeerConnection()
    const channel = createFileChannel()
    const onChannelOpen = () => {
      console.log('数据通道已打开，开始发送文件');
      transferFile(file, channel);
      channel.removeEventListener('open', onChannelOpen);
    };
    channel.addEventListener('open', onChannelOpen);

    const offer = await peerConnection.value.createOffer()
    await peerConnection.value.setLocalDescription(offer)
    socket.emit('webrtc-offer-file', {
      to: remoteUserId.value,
      offer: offer.sdp
    })
  }

  const transferFile = async (file) => {
    const CHUNK_SIZE = 16 * 1024 // 16KB
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    const fileId = Date.now() + '-' + Math.random().toString(36).substr(2, 9)

    // 1. 发送文件元信息
    dataChannel.value.send(JSON.stringify({
      type: 'file-meta',
      fileId,
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      totalChunks,
    }))

    // 2. 分片发送
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)
      
      // 将Blob转换为ArrayBuffer再转为Base64
      const buffer = await chunk.arrayBuffer()
      const base64 = arrayBufferToBase64(buffer)

      dataChannel.value.send(JSON.stringify({
        type: 'file-chunk',
        fileId,
        index: i,
        data: base64,
      }))
      console.log('发送分片:', i, '共', totalChunks)
      // 可以在这里更新进度（比如在UI中显示）
      fileTransferProgress.value = ((i + 1) / totalChunks) * 100
    }

    console.log('文件发送完成');
    // 可选：传输完成后关闭数据通道和连接
    // endFileTransfer()
  }

  const endFileTransfer = () => {
    dataChannel.value.close();
    dataChannel.value = null;
    peerConnection.value?.close();
    peerConnection.value = null;
  }

  // 接受文件（对外暴露的方法）
  const acceptFile = async (from, offer) => {
    remoteUserId.value = from
    peerConnection.value = createPeerConnection()
    handleOffer(offer)
  }

  // 辅助：ArrayBuffer转Base64
  const arrayBufferToBase64 = (buffer) => {
    let binary = ''
    const bytes = new Uint8Array(buffer)
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  return {
    localStream,
    remoteStream,
    callStatus,
    startCall,
    acceptCall,
    handleAnswer,
    handleCandidate,
    endCall,
    createFileChannel,
    sendFile,
    acceptFile,
    endFileTransfer,
    fileTransferProgress,
  };
}