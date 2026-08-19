# Insurisk

Insurisk e um projeto backend em NestJS para demonstrar uma arquitetura simples de microsservicos aplicada ao dominio de seguros.

O sistema possui dois servicos principais:

- `quote-service`: CRUD de cotacoes de seguro, persistido em PostgreSQL.
- `risk-service`: CRUD de perfis de risco, persistido em MongoDB.
- RabbitMQ: comunicacao assincroma/RPC entre os servicos para calculo de risco durante a criacao de uma cotacao.

## Arquitetura

O projeto esta organizado como um monorepo NestJS:

```text
apps/
  quote-service/
    src/
      quotes/
  risk-service/
    src/
      risks/
libs/
  common/
    src/
docker-compose.yml
.env.example
```

### Fluxo principal

1. Um perfil de risco pode ser cadastrado no `risk-service` via `POST /risks`.
2. Uma cotacao e criada no `quote-service` via `POST /quotes`.
3. O `quote-service` envia uma mensagem RabbitMQ para o padrao `risk.calculate`.
4. O `risk-service` calcula o score de risco com base no perfil existente ou nos dados enviados na cotacao.
5. O `quote-service` calcula o premio (`premium`) e salva a cotacao no PostgreSQL.

## Tecnologias

- Node.js 18+
- NestJS
- TypeScript
- PostgreSQL
- MongoDB
- RabbitMQ
- TypeORM
- Mongoose
- Jest
- ESLint
- Docker Compose

## Requisitos

Antes de rodar o projeto, instale:

- Node.js 18 ou superior
- npm
- Docker e Docker Compose

## Configuracao

Instale as dependencias:

```bash
npm install
```

Crie o arquivo `.env` a partir do exemplo:

```powershell
Copy-Item .env.example .env
```

No Linux/macOS, use:

```bash
cp .env.example .env
```

Variaveis disponiveis:

```env
QUOTE_SERVICE_PORT=3000
RISK_SERVICE_PORT=3001

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=insurisk
POSTGRES_PASSWORD=insurisk
POSTGRES_DB=insurisk_quotes

MONGO_URI=mongodb://localhost:27017/insurisk_risks
RABBITMQ_URL=amqp://localhost:5672
```

## Subindo a infraestrutura

Execute:

```bash
docker compose up -d
```

Servicos expostos:

| Servico | URL/porta |
| --- | --- |
| PostgreSQL | `localhost:5432` |
| MongoDB | `localhost:27017` |
| RabbitMQ | `localhost:5672` |
| RabbitMQ Management | `http://localhost:15672` |

Credenciais padrao do RabbitMQ Management:

```text
usuario: guest
senha: guest
```

## Rodando a aplicacao

Para subir os dois microsservicos em modo desenvolvimento:

```bash
npm run start:dev
```

Para subir somente o servico de cotacoes:

```bash
npm run start:quote
```

Para subir somente o servico de risco:

```bash
npm run start:risk
```

URLs padrao:

| Servico | URL |
| --- | --- |
| Cotacoes | `http://localhost:3000` |
| Risco | `http://localhost:3001` |

## Endpoints

### Cotacoes

Base URL:

```text
http://localhost:3000
```

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `POST` | `/quotes` | Cria uma cotacao e calcula risco via RabbitMQ |
| `GET` | `/quotes` | Lista cotacoes |
| `GET` | `/quotes/:id` | Busca uma cotacao por ID |
| `PATCH` | `/quotes/:id` | Atualiza uma cotacao |
| `DELETE` | `/quotes/:id` | Remove uma cotacao |

Exemplo de criacao:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:3000/quotes `
  -ContentType "application/json" `
  -Body '{
    "customerName": "Ada Lovelace",
    "customerDocument": "12345678900",
    "insuranceType": "home",
    "insuredAmount": 250000,
    "age": 42,
    "claimsHistory": 1,
    "riskFactors": ["coastal"]
  }'
```

Resposta esperada:

```json
{
  "id": "uuid-da-cotacao",
  "customerName": "Ada Lovelace",
  "customerDocument": "12345678900",
  "insuranceType": "home",
  "insuredAmount": 250000,
  "riskScore": 58,
  "premium": 17000,
  "status": "quoted",
  "createdAt": "2026-08-19T00:00:00.000Z",
  "updatedAt": "2026-08-19T00:00:00.000Z"
}
```

### Risco

Base URL:

```text
http://localhost:3001
```

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `POST` | `/risks` | Cria um perfil de risco |
| `GET` | `/risks` | Lista perfis de risco |
| `GET` | `/risks/:id` | Busca um perfil de risco por ID |
| `PATCH` | `/risks/:id` | Atualiza um perfil de risco e recalcula score |
| `DELETE` | `/risks/:id` | Remove um perfil de risco |

Exemplo de criacao:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:3001/risks `
  -ContentType "application/json" `
  -Body '{
    "customerDocument": "12345678900",
    "age": 42,
    "claimsHistory": 1,
    "riskFactors": ["coastal"]
  }'
```

Resposta esperada:

```json
{
  "customerDocument": "12345678900",
  "age": 42,
  "claimsHistory": 1,
  "riskFactors": ["coastal"],
  "score": 58,
  "id": "id-do-perfil",
  "createdAt": "2026-08-19T00:00:00.000Z",
  "updatedAt": "2026-08-19T00:00:00.000Z"
}
```

## Modelo de dados

### Quote

Persistido no PostgreSQL.

| Campo | Tipo | Descricao |
| --- | --- | --- |
| `id` | UUID | Identificador da cotacao |
| `customerName` | string | Nome do cliente |
| `customerDocument` | string | Documento do cliente |
| `insuranceType` | string | Tipo de seguro |
| `insuredAmount` | number | Valor segurado |
| `riskScore` | number | Score retornado pelo servico de risco |
| `premium` | number | Premio calculado |
| `status` | enum | Status da cotacao |
| `createdAt` | Date | Data de criacao |
| `updatedAt` | Date | Data da ultima atualizacao |

### RiskProfile

Persistido no MongoDB.

| Campo | Tipo | Descricao |
| --- | --- | --- |
| `id` | ObjectId | Identificador do perfil |
| `customerDocument` | string | Documento do cliente |
| `age` | number | Idade |
| `claimsHistory` | number | Quantidade de sinistros anteriores |
| `riskFactors` | string[] | Fatores de risco |
| `score` | number | Score calculado |
| `createdAt` | Date | Data de criacao |
| `updatedAt` | Date | Data da ultima atualizacao |

## Calculo de risco e premio

O `risk-service` calcula um score entre `0` e `100`.

O calculo considera:

- idade;
- historico de sinistros;
- fatores de risco informados, como `coastal`, `commercial`, `fire`, `flood`, `health_condition` e `theft`.

O `quote-service` calcula o premio usando:

```text
premium = insuredAmount * (0.01 + riskScore / 1000)
```

Exemplo:

```text
insuredAmount = 100000
riskScore = 35
premium = 100000 * (0.01 + 0.035)
premium = 4500
```

## RabbitMQ

A fila utilizada e:

```text
risk_queue
```

Padrao de mensagem:

```text
risk.calculate
```

Payload enviado pelo `quote-service`:

```json
{
  "customerDocument": "12345678900",
  "age": 42,
  "claimsHistory": 1,
  "riskFactors": ["coastal"]
}
```

Resposta do `risk-service`:

```json
{
  "customerDocument": "12345678900",
  "score": 58
}
```

Se o RabbitMQ ou o `risk-service` estiver indisponivel, a criacao da cotacao retorna erro controlado de indisponibilidade.

## Scripts

| Script | Descricao |
| --- | --- |
| `npm run build` | Compila os dois servicos |
| `npm run start:quote` | Inicia o `quote-service` |
| `npm run start:risk` | Inicia o `risk-service` |
| `npm run start:dev` | Inicia os dois servicos em modo watch |
| `npm run lint` | Executa ESLint |
| `npm run test` | Executa os testes com Jest |

## Testes e qualidade

Execute os testes:

```bash
npm run test
```

Execute o lint:

```bash
npm run lint
```

Compile o projeto:

```bash
npm run build
```

## Troubleshooting

### Porta ja esta em uso

Altere `QUOTE_SERVICE_PORT` ou `RISK_SERVICE_PORT` no arquivo `.env`.

### Erro ao conectar no PostgreSQL, MongoDB ou RabbitMQ

Confirme se os containers estao rodando:

```bash
docker compose ps
```

Se necessario, reinicie a infraestrutura:

```bash
docker compose down
docker compose up -d
```

### Cotacao falha ao criar

Verifique se o `risk-service` esta rodando e se o RabbitMQ esta disponivel. A criacao de cotacao depende da chamada RabbitMQ para calcular o score de risco.

### Resetar os dados locais

Para remover containers e volumes:

```bash
docker compose down -v
```

Depois suba novamente:

```bash
docker compose up -d
```

## Observacao sobre seguranca

O projeto foi criado como uma base didatica de CRUD e microsservicos. Esta versao nao inclui autenticacao, autorizacao, migrations versionadas ou observabilidade avancada.

Antes de usar em producao, recomenda-se adicionar:

- autenticacao e autorizacao;
- migrations em vez de `synchronize: true`;
- logs estruturados;
- health checks;
- validacao de ambiente;
- rate limiting;
- pipeline de CI/CD.
