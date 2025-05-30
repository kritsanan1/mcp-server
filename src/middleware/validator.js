const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Middleware to validate request using express-validator
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    logger.warn(`Validation error: ${JSON.stringify(errorMessages)}`);
    
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errorMessages
    });
  }
  
  next();
};

module.exports = {
  validateRequest
};
