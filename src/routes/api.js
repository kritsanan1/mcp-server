const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const apiLimiter = require('../middleware/rateLimiter');
const { validateRequest } = require('../middleware/validator');

module.exports = (webSocketService) => {
  const apiController = new (require('../controllers/apiController'))(webSocketService);

  // API routes
  router.get('/health', apiController.healthCheck);
  router.get('/stats', apiController.getStats);
  
  // Protected routes (rate limited)
  router.post(
    '/echo',
    apiLimiter,
    [
      body('message')
        .trim()
        .notEmpty()
        .withMessage('Message is required')
        .isLength({ max: 1000 })
        .withMessage('Message must be less than 1000 characters')
    ],
    validateRequest,
    apiController.echo
  );

  return router;
};
