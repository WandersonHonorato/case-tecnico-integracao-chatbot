const { logger } = require('../utils/logger');

const TIPO_ANEXO_ARQUIVO = 'file'; // image | video | audio | file

class SuriApiClient {

  constructor({ baseUrl, token, sendMessagePath, fetchImpl = fetch }) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.sendMessagePath = sendMessagePath;
    this.fetchImpl = fetchImpl;
  }

  clienteConfigurado() {
    return Boolean(this.baseUrl && this.token);
  }

  async _post(path, body) {
    const url = `${this.baseUrl}/api${path}`;

    const response = await this.fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detalhe = await response.text().catch(() => '');
      throw new Error(
        `Chamada à API da Suri falhou (${response.status} ${response.statusText}): ${detalhe}`,
      );
    }

    return response.json().catch(() => ({}));
  }

    /**
   * @param {string} contactId - Id do contato na Suri (@User.id)
   * @param {string} text - texto da mensagem
   */
  async enviarMensagemTexto(contactId, text) {
    if (!this.clienteConfigurado()) {
      logger.warn('SuriApiClient não configurado');
      return undefined;
    }

    const payload = {
      userId: contactId,
      message: { text },
    };

    logger.info('Enviando mensagem de texto via API da Suri', { contactId });
    return this._post(this.sendMessagePath, payload);
  }

  /**
   * @param {string} contactId - Id do contato na Suri (@User.id)
   * @param {Object} media
   * @param {string} media.url - URL pública do PDF
   * @param {string} media.fileName - nome do arquivo
   */
  async enviarMensagemDocumento(contactId, { url, fileName }) {
       if (!this.clienteConfigurado()) {
      logger.warn('SuriApiClient não configurado');
      return undefined;
    }

    const payload = {
      userId: contactId,
      message: {
        attachment: {
          type: TIPO_ANEXO_ARQUIVO,
          fileName,
          payload: { url },
        },
      },
    };

    logger.info('Enviando documento via API da Suri', { contactId, fileName });
    return this._post(this.sendMessagePath, payload);
  }
}

module.exports = { SuriApiClient, TIPO_ANEXO_ARQUIVO };