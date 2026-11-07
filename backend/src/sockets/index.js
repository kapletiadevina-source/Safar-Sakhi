const { verifyToken } = require('../utils/token');

function initializeSocket(io, services) {
  const { notificationService, sosService, delayDetectionService } = services;

  notificationService.setSocketIO(io);
  sosService.setSocketIO(io);
  delayDetectionService.setSocketIO(io);

  io.use((socket, next) => {
    // Authenticate if token provided in auth or query, but allow public tracking joins
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const decoded = verifyToken(token);
        socket.user = decoded;
      } catch (err) {
        // Token invalid, proceed as guest
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    // If authenticated user connected
    if (socket.user) {
      socket.join(`user_${socket.user.id}`);
      if (socket.user.role === 'ADMIN') {
        socket.join('admin_room');
      }
    }

    // Join specific user room explicitly
    socket.on('join_user_room', ({ userId }) => {
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    // Join journey tracking room (by family member or user)
    socket.on('join_journey', ({ journeyId, trackingToken }) => {
      if (journeyId) {
        socket.join(`journey_${journeyId}`);
      }
      if (trackingToken) {
        socket.join(`tracking_${trackingToken}`);
      }
    });

    // Leave journey tracking room
    socket.on('leave_journey', ({ journeyId }) => {
      if (journeyId) {
        socket.leave(`journey_${journeyId}`);
      }
    });

    // Direct live location stream from client
    socket.on('send_location_update', (data) => {
      const { journeyId, trackingToken, latitude, longitude, accuracy, timestamp } = data;
      const updatePayload = {
        journeyId,
        latitude,
        longitude,
        accuracy,
        timestamp: timestamp || new Date().toISOString()
      };

      if (journeyId) {
        io.to(`journey_${journeyId}`).emit('location_updated', updatePayload);
      }
      if (trackingToken) {
        io.to(`tracking_${trackingToken}`).emit('location_updated', updatePayload);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
}

module.exports = initializeSocket;

