const boletosJson = require('../data/boletos.json');

/**
 * @typedef {Object} BoletoRecord
 * @property {string} nome
 * @property {string} referencia
 * @property {string} valor
 * @property {string} vencimento
 * @property {string} arquivo  nome do arquivo PDF
 */

class JsonBoletoRepository {
  /**
   * Foi adicionada a possibilidade de injetar registros diretamente no construtor, para facilitar testes unitários.
   * @param {Record<string, BoletoRecord>} [registros] 
   */
  constructor(registros = boletosJson) {
    this.registros = registros;
  }

  /**
   * Busca o boleto mais recente disponível para o CPF informado, apenas dígitos, 11 caracteres.
   * @param {string} cpfNormalizado 
   * @returns {Promise<BoletoRecord|null>}
   */
  async findByCpf(cpfNormalizado) {
    return this.registros[cpfNormalizado] || null;
  }
}

module.exports = { JsonBoletoRepository };
