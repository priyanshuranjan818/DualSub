require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('dotenv').config();

const config = require('./config');
const app = require('./app');
const logger = require('./utils/logger');

const PORT = config.PORT;

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 DualSub backend running on http://0.0.0.0:${PORT}`);
  logger.info(`   Health check: http://localhost:${PORT}/health`);
  logger.info(`   Environment: ${config.NODE_ENV}`);
});
