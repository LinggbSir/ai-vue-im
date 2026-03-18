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

    // 设置远端描述（对方发来的offer）
    await peerConnection.value.setRemoteDescription({
      type: 'offer',
      sdp: offerSdp
    });

    // 处理缓存的 candidate
    for (const candidate of pendingCandidates.value) {
      try {
        await peerConnection.value.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('添加缓存的 ICE 候选失败', err);
      }
    }
    pendingCandidates.value = []; 

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
  };

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