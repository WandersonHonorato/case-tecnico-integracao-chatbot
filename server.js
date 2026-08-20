const { createApp } = require('./app');
const { env } = require('./src/config/env');
const { logger } = require('./src/utils/logger');

const app = createApp();

app.listen(env.port, () => {
  logger.info(`Servidor ouvindo na porta ${env.port}`);
  logger.info(`BASE_URL configurada como ${env.baseUrl}`);
  logger.info(`Endpoint chamado pelo Flow da Suri: POST ${env.baseUrl}/api/integracaoAPI`);

  if (!env.suriApiBaseUrl || !env.suriApiToken) {
    logger.warn(
      'SURI_API_BASE_URL/SURI_API_TOKEN não configurados',
    );
  }
});