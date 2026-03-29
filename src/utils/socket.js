// src/utils/socket.js
import io from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'

let socket = null
export const initSocket = () => {
  const userStore = useAuthStore();
  const token = userStore.token || localStorage.getItem('token');
  if (!token) return null;

  socket = io(window.location.origin, {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => console.log('Socket connected'));
  socket.on('disconnect', () => console.log('Socket disconnected'));

  return socket;
};

export const getSocket = () => socket
export const closeSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
