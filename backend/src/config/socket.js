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

const jwt = require('jsonwebtoken');

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins.length ? allowedOrigins : '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      
      socket.userId = null;
      return next();
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      
      console.error('Socket authentication failed:', error.message);
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id} (User: ${socket.userId || 'Guest'})`);

    
    socket.on('join_service_room', (service) => {
      socket.join(`${service}_queue`);
      console.log(`Socket ${socket.id} joined room: ${service}_queue`);
    });

    
    socket.on('join_user_room', (userId) => {
      if (socket.userId && socket.userId === userId) {
        socket.join(`user_${userId}`);
        console.log(`Socket ${socket.id} joined personal room: user_${userId}`);
      } else {
        console.warn(`Unauthorized join_user_room attempt by socket ${socket.id} for userId: ${userId}`);
      }
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


const emitQueueUpdate = (service, data) => {
  if (io) {
    io.to(`${service}_queue`).emit('queue-updated', { service, data });
    io.emit('queue-updated', { service, data });
  }
};


const emitTokenUpdate = (userId, tokenDisplayId, data) => {
  if (io) {
    io.to(`user_${userId}`).emit('token_update', { displayId: tokenDisplayId, data });
  }
};


const emitUserNotification = (userId, notification) => {
  if (io) {
    io.to(`user_${userId}`).emit('notification', notification);
  }
};


const emitTokenCreated = (token) => {
  if (io) {
    io.emit('token-created', token);
  }
};


const emitTokenCalled = (token) => {
  if (io) {
    io.emit('token-called', token);
  }
};


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
