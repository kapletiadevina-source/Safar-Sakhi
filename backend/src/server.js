const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config');
const { checkConnection } = require('./config/db');
const initializeSocket = require('./sockets');

const notificationService = require('./services/notificationService');
const sosService = require('./services/sosService');
const delayDetectionService = require('./services/delayDetectionService');

const server = http.createServer(app);

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Attach io to express app for access in controllers
app.set('io', io);

// Initialize real-time socket handlers and link services
initializeSocket(io, {
  notificationService,
  sosService,
  delayDetectionService
});

// Start background Delay Detection monitor
delayDetectionService.start(30000);

// Connect DB & listen
const PORT = config.port;

checkConnection().then(() => {
  server.listen(PORT, () => {
    console.log(`🌸 Safar Sakhi Backend is running on port ${PORT}`);
    console.log(`📡 Real-time Socket.IO listening on port ${PORT}`);
    console.log(`🛡️ "Your Safety, Our Responsibility."`);
  });
});

process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]', err);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
});

