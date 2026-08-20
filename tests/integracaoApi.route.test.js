const request = require('supertest');
const { createApp } = require('../src/app');

class FakeBoletoRepository {
  constructor() {
    this.registros = {
      52998224725: {
        nome: 'Wanderson Honorato',
        referencia: 'Agosto/2026',
        valor: 'R$ 189,90',
        vencimento: '25/08/2026',
        arquivo: 'boleto-52998224725.pdf',
      },
    };
  }

  async findByCpf(cpf) {
    return this.registros[cpf] || null;
  }
}

class FakeSuriApiClient {
  constructor() {
    this.mensagensDeTexto = [];
    this.documentosEnviados = [];
  }

  async enviarMensagemTexto(contactId, text) {
    this.mensagensDeTexto.push({ contactId, text });
  }

  async enviarMensagemDocumento(contactId, media) {
    this.documentosEnviados.push({ contactId, ...media });
  }
}

function montarApp() {
  const repository = new FakeBoletoRepository();
  const suriApiClient = new FakeSuriApiClient();
  const app = createApp({ repository, suriApiClient });
  return { app, repository, suriApiClient };
}

describe('POST /api/segunda-via', () => {
  it('rejeita requisição sem contactId', async () => {
    const { app } = montarApp();
    const res = await request(app).post('/api/segunda-via').send({ cpf: '52998224725' });
    expect(res.status).toBe(400);
  });

  it('envia mensagem pedindo o CPF quando ele não é informado', async () => {
    const { app, suriApiClient } = montarApp();

    const res = await request(app).post('/api/segunda-via').send({ contactId: 'c1' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(suriApiClient.mensagensDeTexto).toHaveLength(1);
    expect(suriApiClient.mensagensDeTexto[0].contactId).toBe('c1');
    expect(suriApiClient.mensagensDeTexto[0].text).toMatch(/CPF/i);
  });

  it('envia mensagem de erro para CPF inválido', async () => {
    const { app, suriApiClient } = montarApp();

    const res = await request(app)
      .post('/api/segunda-via')
      .send({ contactId: 'c2', cpf: '111.111.111-11' });

    expect(res.status).toBe(200);
    expect(suriApiClient.mensagensDeTexto).toHaveLength(1);
    expect(suriApiClient.mensagensDeTexto[0].text).toMatch(/inválido/i);
  });

  it('envia mensagem de "não encontrado" para CPF válido sem boleto', async () => {
    const { app, suriApiClient } = montarApp();

    const res = await request(app)
      .post('/api/segunda-via')
      .send({ contactId: 'c3', cpf: '111.444.777-35' });

    expect(res.status).toBe(200);
    expect(suriApiClient.mensagensDeTexto).toHaveLength(1);
    expect(suriApiClient.mensagensDeTexto[0].text).toMatch(/não localizamos/i);
  });

  it('envia texto explicativo seguido do documento (PDF) via API da Suri para CPF válido com boleto', async () => {
    const { app, suriApiClient } = montarApp();

    const res = await request(app)
      .post('/api/segunda-via')
      .send({ contactId: 'c4', cpf: '529.982.247-25', contactName: 'Maria' });

    expect(res.status).toBe(200);

    expect(suriApiClient.mensagensDeTexto).toHaveLength(1);
    expect(suriApiClient.mensagensDeTexto[0].contactId).toBe('c4');
    expect(suriApiClient.mensagensDeTexto[0].text).toMatch(/Agosto\/2026/);

    expect(suriApiClient.documentosEnviados).toHaveLength(1);
    const doc = suriApiClient.documentosEnviados[0];
    expect(doc.contactId).toBe('c4');
    expect(doc.fileName).toBe('boleto-52998224725.pdf');
    expect(doc.url).toContain('/files/boleto-52998224725.pdf');
  });
});

describe('GET /health', () => {
  it('responde 200 ok', async () => {
    const { app } = montarApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /files/:arquivo', () => {
  it('serve os PDFs mockados publicamente', async () => {
    const { app } = montarApp();
    const res = await request(app).get('/files/boleto-52998224725.pdf');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/pdf/);
  });
});

describe('proteção por x-api-key', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, SURI_SHARED_SECRET: 'segredo-de-teste' };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('rejeita chamada sem a chave configurada', async () => {
    const { createApp: createAppComSegredo } = require('../src/app');
    const app = createAppComSegredo({
      repository: new FakeBoletoRepository(),
      suriApiClient: new FakeSuriApiClient(),
    });

    const res = await request(app)
      .post('/api/segunda-via')
      .send({ contactId: 'c5', cpf: '52998224725' });

    expect(res.status).toBe(401);
  });

  it('aceita chamada com a chave correta', async () => {
    const { createApp: createAppComSegredo } = require('../src/app');
    const app = createAppComSegredo({
      repository: new FakeBoletoRepository(),
      suriApiClient: new FakeSuriApiClient(),
    });

    const res = await request(app)
      .post('/api/segunda-via')
      .set('x-api-key', 'segredo-de-teste')
      .send({ contactId: 'c6', cpf: '52998224725' });

    expect(res.status).toBe(200);
  });
});
