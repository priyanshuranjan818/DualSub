const cors = require('cors');
const config = require('../config');

const corsMiddleware = cors({
  origin: config.ALLOWED_ORIGIN,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Groq-Api-Key'],
});

module.exports = corsMiddleware;
