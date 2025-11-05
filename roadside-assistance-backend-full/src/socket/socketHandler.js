import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

export const setupSocketHandlers = (io) => {
  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userType = decoded.type;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}, User: ${socket.userId}, Type: ${socket.userType}`);

    // Join user/workshop specific room
    if (socket.userType === 'user') {
      socket.join(`user_${socket.userId}`);
    } else if (socket.userType === 'workshop') {
      socket.join(`workshop_${socket.userId}`);
    }

    // Join request room
    socket.on('joinRoom', ({ room }) => {
      socket.join(room);
      logger.info(`Socket ${socket.id} joined room: ${room}`);
      socket.emit('roomJoined', { room });
    });

    // Leave request room
    socket.on('leaveRoom', ({ room }) => {
      socket.leave(room);
      logger.info(`Socket ${socket.id} left room: ${room}`);
    });

    // Send message (handled via HTTP API primarily, but can support real-time)
    socket.on('sendMessage', async ({ requestId, message }) => {
      io.to(`request_${requestId}`).emit('receive_message', {
        requestId,
        message: {
          senderId: socket.userId,
          senderRole: socket.userType,
          message,
          timestamp: new Date()
        }
      });
    });

    // Workshop goes online
    socket.on('workshop:goOnline', async ({ workshopId }) => {
      if (socket.userType === 'workshop' && socket.userId === workshopId) {
        logger.info(`Workshop ${workshopId} went online`);
        io.emit('workshop:online', { workshopId });
      }
    });

    // Workshop goes offline
    socket.on('workshop:goOffline', async ({ workshopId }) => {
      if (socket.userType === 'workshop' && socket.userId === workshopId) {
        logger.info(`Workshop ${workshopId} went offline`);
        io.emit('workshop:offline', { workshopId });
      }
    });

    // Workshop location update (for live tracking)
    socket.on('workshop:updateLocation', ({ requestId, lat, lng }) => {
      if (socket.userType === 'workshop') {
        io.to(`request_${requestId}`).emit('workshop_location_update', {
          requestId,
          workshopId: socket.userId,
          lat,
          lng,
          timestamp: new Date()
        });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};