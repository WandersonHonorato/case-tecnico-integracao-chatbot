const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { env } = require('./src/config/env');
const { integracaoApiRouter } = require('./src/routes/integracaoApi.routes');
const { JsonBoletoRepository } = require('./src/services/boleto.repository');
const { SuriApiClient } = require('./src/services/suriApi.client');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');

function createApp(options = {}) {
  const repository = options.repository || new JsonBoletoRepository();

  const suriApiClient =
    options.suriApiClient ||
    new SuriApiClient({ baseUrl: env.suriApiBaseUrl, token: env.suriApiToken, sendMessagePath: env.suriSendMessagePath,
    });

  const app = express();

  // Middlewares globais
  app.use(helmet()); // cabeçalhos HTTP de segurança 
  app.use(cors()); // permite chamadas cross-origin
  app.use(express.json({ limit: '256kb' })); // parseia corpo JSON das requisições
  app.use(morgan(env.isTest ? 'dev' : 'combined')); // log de acesso HTTP

  // Limite de requisições para o endpoint principal
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 60,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', limiter);

  // Arquivos estáticos
  app.use('/files', express.static(path.join(__dirname, 'public', 'files')));


  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'suri-segunda-via-boleto' });
  });

  app.use('/api', integracaoApiRouter(repository, suriApiClient));

  // --- Tratamento de erro
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };