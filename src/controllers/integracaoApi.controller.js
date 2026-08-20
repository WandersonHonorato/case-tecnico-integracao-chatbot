const { env } = require('../config/env');
const { validateCpf } = require('../services/cpf.service');
const { logger } = require('../utils/logger');

// constantes de mensagens personalizados para retornos
const MENSAGENS = {
  cpfAusente: 'Por gentileza, envie seu CPF corretamente. Pode digitar novamente, apenas números?',
  cpfInvalido: (formatted) =>
    `O CPF ${formatted} parece inválido. Confira os números e envie novamente, por favor.`,
  naoEncontrado:
    'Não localizamos nenhuma fatura em aberto para o CPF informado em nossa base. Se acha que isso é um engano, digite "atendente" para falar com nosso time.',
  sucesso: (referencia) => `Boleto localizado! Aqui está a 2ª via da sua fatura de ${referencia}. 📄`,
  falhaEnvio:
    'Localizamos sua fatura, mas tivemos um problema técnico ao enviá-la agora. Tente novamente em instantes.',
};

// Recebe as dependências (repositório de boletos e cliente da API da Suri Shop) por injeção, em vez de instanciá-las.
function createIntegracaoApiController(repository, suriApiClient) {
  return async function integracaoApi(req, res, next) {
    try {
      const body = req.body || {};
      const { cpf: cpfBruto, contactId, contactName } = body;

      logger.info('Requisição de 2ª via recebida', { contactId, contactName });

      if (!contactId) {
        logger.warn('Requisição sem contactId - não é possível responder via API da Suri');
        res.status(400).json({ ok: false, error: 'contactId é obrigatório' });
        return;
      }

      // condicional para caso o CPF vazio ou não seja enviado corretamente
      if (!cpfBruto || !String(cpfBruto).trim()) {
        await suriApiClient.enviarMensagemTexto(contactId, MENSAGENS.cpfAusente);
        res.status(200).json({ ok: true });
        return;
      }

      // condicional para verificar se o CPF tem formato/dígito verificador válido
      const validation = validateCpf(cpfBruto);

      if (!validation.valid) {
        logger.info('CPF inválido recebido', { reason: validation.reason });
        await suriApiClient.enviarMensagemTexto(
          contactId,
          MENSAGENS.cpfInvalido(validation.formatted),
        );
        res.status(200).json({ ok: true });
        return;
      }

      // condicional para verificar se existe boleto cadastrado para esse CPF
      const boleto = await repository.findByCpf(validation.normalized);

      if (!boleto) {
        logger.info('CPF válido, mas não possui boleto disponível para esse CPF', {
          cpf: validation.normalized,
        });
        await suriApiClient.enviarMensagemTexto(contactId, MENSAGENS.naoEncontrado);
        res.status(200).json({ ok: true });
        return;
      }

      // condicional para caso possua boleto localizado com o CPF informado, envia a resposta via API da Suri
      const url = `${env.baseUrl}/files/${encodeURIComponent(boleto.arquivo)}`;

      logger.info('Boleto localizado, enviando resposta via API da Suri', {
        cpf: validation.normalized,
        arquivo: boleto.arquivo,
      });

      try {
        await suriApiClient.enviarMensagemTexto(contactId, MENSAGENS.sucesso(boleto.referencia));
        await suriApiClient.enviarMensagemDocumento(contactId, {
          url,
          fileName: boleto.arquivo,
        });
      } catch (erroEnvio) {
        // boleto encontrado, mas apresentou falha (ex:  token expirado, sessão do contato expirada).
        logger.error('Falha ao enviar resposta via API da Suri', {
          error: erroEnvio.message,
        });
        await suriApiClient
          .enviarMensagemTexto(contactId, MENSAGENS.falhaEnvio)
          .catch(() => undefined);
      }

      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = { createIntegracaoApiController, MENSAGENS };