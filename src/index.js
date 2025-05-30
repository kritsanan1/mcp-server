const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Import config and utils
const config = require('./config/config');
const logger = require('./utils/logger');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// WebSocket Service
const WebSocketService = require('./services/webSocketService');
const webSocketService = new WebSocketService(server);

// Middleware
app.use(helmet()); // Security headers
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('dev', { stream: logger.stream }));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api', require('./routes/api')(webSocketService));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Not Found',
    error: `Cannot ${req.method} ${req.path}`
  });
});

// Error handling middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle SIGTERM for graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

// Start the server
const PORT = config.port;
server.listen(PORT, () => {
  logger.info(`Server running in ${config.env} mode on port ${PORT}`);
  logger.info(`WebSocket server running on ws://localhost:${PORT}/ws`);
});

module.exports = { app, server };
