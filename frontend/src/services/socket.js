import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  return `${window.location.protocol}//${window.location.hostname}:5000`;
};

const SOCKET_URL = getSocketUrl();

let socket = null;

export const initiateSocket = (token) => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ['websocket'],
  });

  console.log('Connecting socket...');
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('Disconnecting socket...');
    socket.disconnect();
    socket = null;
  }
};

export const joinServiceRoom = (service) => {
  if (socket) {
    socket.emit('join_service_room', service);
  }
};

export const joinUserRoom = (userId) => {
  if (socket) {
    socket.emit('join_user_room', userId);
  }
};

export const emitAdminAction = (action, data) => {
  if (!socket) return;
  socket.emit('admin-action', { action, data });
};

export const getSocket = () => socket;
