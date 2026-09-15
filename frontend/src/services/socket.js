import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://127.0.0.1:5000";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  transports: ['websocket', 'polling']
});

let currentSocketUser = null;

export const initializeSocket = (user) => {
  currentSocketUser = user || null;
  if (!socket.connected) {
    socket.connect();
  } else if (currentSocketUser && currentSocketUser.id) {
    socket.emit('join_user_room', { user_id: currentSocketUser.id, role: currentSocketUser.role });
  }
  return socket;
};

export const getCurrentSocketUser = () => currentSocketUser;

export const disconnectSocket = () => {
  currentSocketUser = null;
  if (socket.connected) {
    socket.disconnect();
  }
};

// Automatically rejoin room on reconnect
socket.on('connect', () => {
  if (currentSocketUser && currentSocketUser.id) {
    socket.emit('join_user_room', { user_id: currentSocketUser.id, role: currentSocketUser.role });
  }
});

export default socket;
