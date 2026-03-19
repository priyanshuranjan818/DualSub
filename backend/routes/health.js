const express = require('express');
const router = express.Router();
const cacheService = require('../services/cacheService');

const startTime = Date.now();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: '1.0.0',
    cacheSize: cacheService.getCacheSize(),
  });
});

module.exports = router;
