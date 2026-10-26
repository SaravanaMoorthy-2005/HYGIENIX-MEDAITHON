import { io } from 'socket.io-client';

let socket = null;
const listeners = new Map();

export function initSocket(onStatusChange) {
  if (socket) return socket;

  const socketUrl = import.meta.env?.VITE_SOCKET_URL;
  if (!socketUrl && import.meta.env?.PROD) {
    // In serverless production environments without a dedicated WebSocket server,
    // signal disconnected so the application runs its built-in polling fallback.
    if (onStatusChange) onStatusChange(false);
    return null;
  }

  socket = io(socketUrl || '/', {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 2000
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
  if (!socket) return () => {};
  socket.on(eventName, callback);

  return () => {
    if (socket) socket.off(eventName, callback);
  };
}

export function getSocket() {
  return socket;
}
