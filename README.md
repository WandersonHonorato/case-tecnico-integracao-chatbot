# case-tecnico-integracao-chatbot

Integração entre a API chatbot **Suri (Chatbot Maker)** e um serviço próprio (Node.js + Express) para
envio de **2ª via de boleto via WhatsApp**, com validação de CPF.

## Como funciona

1. No WhatsApp, o contato pede a 2ª via do boleto → o Flow da Suri pergunta o CPF;
2. A Suri chama `POST /api/integracaoAPI` deste serviço, passando o CPF e o id do contato;
3. O serviço valida o CPF (dígito verificador), busca o boleto na base e **chama ativamente a
   API da Suri** (`Authorization: Bearer <token>`) para entregar o PDF — ou uma mensagem de erro,
   se o CPF for inválido ou não houver boleto para ele.

```
WhatsApp → Flow Suri (captura CPF) → POST /api/integracaoAPI (este serviço)
                                            │
                                            ├─ valida CPF
                                            ├─ busca boleto em src/data/boletos.json
                                            └─ POST {endpoint}/api/messages/send (API da Suri)
                                                       │
                                                       ▼
                                              contato recebe a resposta no WhatsApp
```

## Estrutura do projeto

```
app.js                          # monta o Express (testável, sem listen())
server.js                       # entrypoint - sobe o servidor HTTP
src/
  config/env.js                 # variáveis de ambiente
  controllers/integracaoApi.controller.js
  routes/integracaoApi.routes.js
  services/
    cpf.service.js              # validação de CPF (módulo 11)
    boleto.repository.js        # busca o boleto (JSON local, plugável)
    suriApi.client.js           # cliente da API da Suri (Bearer token)
  middleware/                   # apiKey.middleware.js, errorHandler.js
  data/boletos.json             # base de boletos de teste
public/files/                   # PDFs mockados dos boletos
tests/                          # Jest + Supertest
```

## Rodando localmente

Pré-requisito: Node.js ≥ 18.

```bash
npm install
cp .env.example .env
npm run dev
```

Sobe em `http://localhost:3000`. Sem `SURI_API_BASE_URL`/`SURI_API_TOKEN` reais no `.env`, o
serviço funciona normalmente mas só *loga* o que enviaria (não chama a Suri de verdade).

### Variáveis de ambiente (`.env`)

| Variável | O que é |
|---|---|
| `PORT` | Porta do servidor (padrão 3000) |
| `BASE_URL` | URL pública deste serviço (monta o link do PDF enviado) |
| `SURI_SHARED_SECRET` | Chave usada no header `x-api-key`, pra proteger `/api/integracaoAPI` |
| `SURI_API_BASE_URL` | Campo **Endpoint** do Portal (Configurações › Geral), sem `/api` no final |
| `SURI_API_TOKEN` | Campo **Token** do Portal |
| `SURI_SEND_MESSAGE_PATH` | Path do endpoint de envio (padrão `/messages/send`, já confirmado) |
| `SURI_CHATBOT_ID` | Campo **Identificador** do Portal |

## Testes

```bash
npm test              # Jest + Supertest
npm run test:coverage # com cobertura
npm run lint           # ESLint
```

## Testando manualmente

```bash
# CPF válido com boleto cadastrado
curl -s -X POST http://localhost:3000/api/integracaoAPI \
  -H "Content-Type: application/json" \
  -H "x-api-key: <SURI_SHARED_SECRET do seu .env>" \
  -d '{"cpf": "529.982.247-25", "contactId": "teste-1"}'

# CPF inválido
curl -s -X POST http://localhost:3000/api/integracaoAPI \
  -H "Content-Type: application/json" \
  -H "x-api-key: <SURI_SHARED_SECRET do seu .env>" \
  -d '{"cpf": "111.111.111-11", "contactId": "teste-2"}'
```

Ou importe `postman/collection.json` no Postman. Os 10 CPFs de teste (todos com dígito
verificador válido) estão em `src/data/boletos.json`.

## Docker

```bash
docker compose up --build
```
## Autor: Wanderson Honorato