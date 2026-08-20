require('dotenv/config'); // carrega o arquivo .env para dentro de process.env

const env = {
  port: Number(process.env.PORT || 3000),

  baseUrl: (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, ''),

  suriSharedSecret: process.env.SURI_SHARED_SECRET || '',
  suriApiBaseUrl: (process.env.SURI_API_BASE_URL || '').replace(/\/$/, ''),
  suriApiToken: process.env.SURI_API_TOKEN || '',
  suriSendMessagePath: process.env.SURI_SEND_MESSAGE_PATH || '/messages/send',
  suriChatbotId: process.env.SURI_CHATBOT_ID || '',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

module.exports = { env };