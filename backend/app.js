const express = require('express');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');
const corsMiddleware = require('./middleware/cors');
const { importLimiter, subtitleLimiter } = require('./middleware/rateLimit');
const errorHandler = require('./middleware/errorHandler');
const healthRouter = require('./routes/health');
const importRouter = require('./routes/import');
const subtitlesRouter = require('./routes/subtitles');
const metaRouter = require('./routes/meta');
const videoRouter = require('./routes/video');
const logger = require('./utils/logger');

const app = express();

// ── Global Middleware ────────────────────────────────────────────────────────
app.use(corsMiddleware);
app.use(express.json({ limit: '1kb' }));

// Add request ID to every request
app.use((req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: Date.now() - start,
      requestId: req.requestId,
    });
  });
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/health', healthRouter);
app.use('/api/import', importLimiter, importRouter);
app.use('/api/subtitles', subtitleLimiter, subtitlesRouter);
app.use('/api/meta', subtitleLimiter, metaRouter);
app.use('/api/video', subtitleLimiter, videoRouter);

// ── Static Frontend Serving ───────────────────────────────────────────────────
if (config.NODE_ENV === 'production') {
  const path = require('path');
  const frontendPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendPath));
  
  // SPA Fallback: any unknown non-API route serves index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
