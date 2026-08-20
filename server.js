const { createApp } = require('./app');
const { env } = require('./config/env');
const { logger } = require('./utils/logger');

const app = createApp();

app.listen(env.port, () => {
  logger.info(`Servidor ouvindo na porta ${env.port}`);
  logger.info(`BASE_URL configurada como ${env.baseUrl}`);
  logger.info(`Endpoint chamado pelo Flow da Suri: POST ${env.baseUrl}/api/case-tecnico-integracao-chatbot`,);
  
  if (!env.suriApiBaseUrl || !env.suriApiToken) {
    logger.warn("SURI_API_TOKEN",);
  }
});