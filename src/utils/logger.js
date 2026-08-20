function timestamp() {
  return new Date().toISOString();
}

const logger = {
  info(message, meta) {
    // eslint-disable-next-line no-console
    console.log(`[${timestamp()}] INFO  ${message}`, meta || '');
  },
  warn(message, meta) {
    // eslint-disable-next-line no-console
    console.warn(`[${timestamp()}] WARN  ${message}`, meta || '');
  },
  error(message, meta) {
    // eslint-disable-next-line no-console
    console.error(`[${timestamp()}] ERROR ${message}`, meta || '');
  },
};

module.exports = { logger };