const logger = require('../utils/logger');

class ApiController {
  constructor(webSocketService) {
    this.webSocketService = webSocketService;
  }

  /**
   * Echo endpoint - returns the sent message
   */
  echo(req, res, next) {
    try {
      const { message } = req.body;
      
      if (!message) {
        const error = new Error('Message is required');
        error.statusCode = 400;
        throw error;
      }
      
      logger.info(`Echo request: ${message}`);
      
      res.json({
        success: true,
        message: 'Message received',
        data: {
          echo: message,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get server stats
   */
  getStats(req, res, next) {
    try {
      const stats = this.webSocketService ? this.webSocketService.getStats() : {};
      
      res.json({
        success: true,
        data: {
          status: 'Server is running',
          timestamp: new Date().toISOString(),
          ...stats
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Health check endpoint
   */
  healthCheck(req, res) {
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }
}

module.exports = ApiController;
