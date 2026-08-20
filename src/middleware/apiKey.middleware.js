const { env } = require('../config/env');
const { logger } = require('../utils/logger');

const HEADER_NAME = 'x-api-key';

function apiKeyGuard(req, res, next) {
  if (!env.suriSharedSecret) {
    next();
    return;
  }

  const provided = req.header(HEADER_NAME);

  if (provided !== env.suriSharedSecret) {
    logger.warn('Requisição rejeitada: x-api-key ausente ou inválida', { path: req.path });
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  next();
}

module.exports = { apiKeyGuard };
