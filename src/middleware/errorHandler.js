const { logger } = require('../utils/logger');

function errorHandler(err, req, res, _next) {
  logger.error('Erro não tratado na aplicação', {
    path: req.path,
    error: err instanceof Error ? err.message : String(err),
  });

  res.status(500).json({ ok: false, error: 'internal_error' });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'not_found', path: req.path });
}

module.exports = { errorHandler, notFoundHandler };