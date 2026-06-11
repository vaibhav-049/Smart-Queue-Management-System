const { Server } = require('socket.io');

let io = null;

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]
  .filter(Boolean)
  .flatMap(origin => origin.split(',').map(item => item.trim()))
  .filter(Boolean);

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins.length ? allowedOrigins : '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Join room based on service type (e.g. 'hospital_queue') for targeted updates
    socket.on('join_service_room', (service) => {
      socket.join(`${service}_queue`);
      console.log(`Socket ${socket.id} joined room: ${service}_queue`);
    });

    // Join room based on userId for personal notifications
    socket.on('join_user_room', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} joined personal room: user_${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Please run initSocket(server) first.');
  }
  return io;
};

// Helper function to emit queue updates
const emitQueueUpdate = (service, data) => {
  if (io) {
    io.to(`${service}_queue`).emit('queue-updated', { service, data });
    io.emit('queue-updated', { service, data });
  }
};

// Helper function to emit token-specific changes
const emitTokenUpdate = (userId, tokenDisplayId, data) => {
  if (io) {
    io.to(`user_${userId}`).emit('token_update', { displayId: tokenDisplayId, data });
  }
};

// Helper function to emit user notifications
const emitUserNotification = (userId, notification) => {
  if (io) {
    io.to(`user_${userId}`).emit('notification', notification);
  }
};

// Helper function to emit token created event
const emitTokenCreated = (token) => {
  if (io) {
    io.emit('token-created', token);
  }
};

// Helper function to emit token called event
const emitTokenCalled = (token) => {
  if (io) {
    io.emit('token-called', token);
  }
};

// Helper function to emit queue completed event
const emitQueueCompleted = (service) => {
  if (io) {
    io.emit('queue-completed', { service });
  }
};

module.exports = {
  initSocket,
  getIO,
  emitQueueUpdate,
  emitTokenUpdate,
  emitUserNotification,
  emitTokenCreated,
  emitTokenCalled,
  emitQueueCompleted,
};
