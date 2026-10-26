const { Server } = require('socket.io');

let io = null;

function initSockets(httpServer, corsOrigin) {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin || '*',
      methods: ['GET', 'POST', 'PATCH']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
    });

    socket.on('ping_check', (cb) => {
      if (typeof cb === 'function') cb({ status: 'pong', timestamp: new Date().toISOString() });
    });
  });

  return io;
}

function getIO() {
  return io;
}

function broadcastEvent(eventName, data) {
  if (io) {
    io.emit(eventName, data);
  }
}

module.exports = {
  initSockets,
  getIO,
  broadcastEvent
};
