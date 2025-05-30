const logger = require('../utils/logger');
const { NODE_ENV } = require('../config/config');

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  const response = {
    success: false,
    message: err.message || 'Internal Server Error',
    ...(NODE_ENV === 'development' && { stack: err.stack })
  };

  // Log the error
  logger.error(
    `${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip} - Stack: ${err.stack}`
  );

  // Send the error response
  res.status(statusCode).json(response);
};

module.exports = errorHandler;
