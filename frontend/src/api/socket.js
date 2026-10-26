import { io } from 'socket.io-client';

let socket = null;
const listeners = new Map();

export function initSocket(onStatusChange) {
  if (socket) return socket;

  socket = io('/', {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 20,
    reconnectionDelay: 1000
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected to backend real-time gateway:', socket.id);
    if (onStatusChange) onStatusChange(true);
  });

  socket.on('disconnect', (reason) => {
    console.warn('[Socket] Disconnected from gateway:', reason);
    if (onStatusChange) onStatusChange(false);
  });

  socket.on('connect_error', (error) => {
    console.warn('[Socket] Connection error:', error.message);
    if (onStatusChange) onStatusChange(false);
  });

  return socket;
}

export function subscribeToEvent(eventName, callback) {
  if (!socket) initSocket();
  socket.on(eventName, callback);

  return () => {
    socket.off(eventName, callback);
  };
}

export function getSocket() {
  return socket;
}
