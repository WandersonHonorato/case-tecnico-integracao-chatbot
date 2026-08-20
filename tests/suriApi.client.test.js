const { SuriApiClient } = require('../src/services/suriApi.client');

function criarFetchFake({ ok = true, status = 200, jsonBody = {} } = {}) {
  const chamadas = [];

  const fetchFake = async (url, init) => {
    chamadas.push({ url, init });
    return {
      ok,
      status,
      statusText: ok ? 'OK' : 'Erro',
      json: async () => jsonBody,
      text: async () => JSON.stringify(jsonBody),
    };
  };

  fetchFake.chamadas = chamadas;
  return fetchFake;
}

describe('SuriApiClient', () => {
  const baseUrl = 'https://cb000000000.api.suri.ai';
  const token = 'token-de-teste';
  const sendMessagePath = '/messages/send';

  it('envia mensagem de texto com autenticação Bearer e o payload CONFIRMADO na doc oficial', async () => {
    const fetchFake = criarFetchFake();
    const client = new SuriApiClient({ baseUrl, token, sendMessagePath, fetchImpl: fetchFake });

    await client.enviarMensagemTexto('contato-1', 'Olá!');

    expect(fetchFake.chamadas).toHaveLength(1);
    const { url, init } = fetchFake.chamadas[0];

    expect(url).toBe(`${baseUrl}/api${sendMessagePath}`);
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe(`Bearer ${token}`);


    // Formato confirmado na documentação Postman (Mensagens > Mensagem de texto: { "userId": "...", "message": { "text": "..." } }
    const body = JSON.parse(init.body);
    expect(body).toEqual({ userId: 'contato-1', message: { text: 'Olá!' } });
  });

  it('envia documento no formato aninhado (message.attachment.payload.url)', async () => {
    const fetchFake = criarFetchFake();
    const client = new SuriApiClient({ baseUrl, token, sendMessagePath, fetchImpl: fetchFake });

    await client.enviarMensagemDocumento('contato-2', {
      url: 'https://exemplo.com/files/boleto.pdf',
      fileName: 'boleto.pdf',
    });

    const body = JSON.parse(fetchFake.chamadas[0].init.body);

    expect(body).toEqual({
      userId: 'contato-2',
      message: {
        attachment: {
          type: 'file',
          fileName: 'boleto.pdf',
          payload: { url: 'https://exemplo.com/files/boleto.pdf' },
        },
      },
    });
  });

  it('lança erro quando a resposta HTTP não é ok', async () => {
    const fetchFake = criarFetchFake({ ok: false, status: 500 });
    const client = new SuriApiClient({ baseUrl, token, sendMessagePath, fetchImpl: fetchFake });

    await expect(client.enviarMensagemTexto('contato-3', 'oi')).rejects.toThrow(
      /Chamada à API da Suri falhou/,
    );
  });

  it('não tenta chamar a rede se baseUrl/token não estiverem configurados', async () => {
    const fetchFake = criarFetchFake();
    const client = new SuriApiClient({
      baseUrl: '',
      token: '',
      sendMessagePath,
      fetchImpl: fetchFake,
    });

    await client.enviarMensagemTexto('contato-4', 'oi');

    expect(fetchFake.chamadas).toHaveLength(0);
  });

  it('monta a URL final como {endpoint}/api{path}', async () => {
    const fetchFake = criarFetchFake();
    const client = new SuriApiClient({
      baseUrl: 'https://cb000000000.api.suri.ai',
      token,
      sendMessagePath: '/messages/send',
      fetchImpl: fetchFake,
    });

    await client.enviarMensagemTexto('contato-5', 'oi');

    expect(fetchFake.chamadas[0].url).toBe('https://cb000000000.api.suri.ai/api/messages/send');
  });
});
