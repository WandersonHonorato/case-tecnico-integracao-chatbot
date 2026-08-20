const { Router } = require('express');
const { IntegracaoApiController } = require('../controllers/segundaVia.controller');
const { apiKeyGuard } = require('../middleware/apiKey.middleware');

function integracaoApiRouter(repository, suriApiClient) {
  const router = Router();

  router.post('/integracaoAPI', apiKeyGuard, createIntegracaoApiController(repository, suriApiClient));

  return router;
}

module.exports = { integracaoApiRouter };