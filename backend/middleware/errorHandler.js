const logger = require('../utils/logger');
const config = require('../config');

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred.';

  logger.error({
    errorCode,
    message: err.message,
    stack: config.NODE_ENV === 'development' ? err.stack : undefined,
    requestId: req.requestId,
    url: req.originalUrl,
  });

  res.status(statusCode).json({
    error: errorCode,
    message,
    ...(config.NODE_ENV === 'development' && err.details ? { details: err.details } : {}),
  });
}

module.exports = errorHandler;
