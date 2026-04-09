const cors = require('cors');
const config = require('../config');

// Support comma-separated list of origins (used in docker-compose for dev + prod)
const allowedOrigins = config.ALLOWED_ORIGIN
  ? config.ALLOWED_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)
  : [];

const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow server-to-server (no origin) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`Origin '${origin}' not allowed by CORS policy`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Groq-Api-Key'],
});

module.exports = corsMiddleware;
