# 🚀 Guia de Instalação e Configuração Local — Evolution API

Este guia explica, passo a passo, como configurar, rodar e integrar a **Evolution API** localmente no seu computador para testes e desenvolvimento do ecossistema **EstampariaPro**.

A Evolution API é uma API REST robusta que estabelece a comunicação direta com o WhatsApp (usando Baileys), permitindo envio de mensagens de texto, mídias, sincronização de chats e acompanhamento em tempo real no nosso CRM Premium.

---

## 📋 Pré-requisitos
Antes de iniciar, certifique-se de que você possui instalado em sua máquina:
1. **Docker e Docker Compose** (Recomendado) — [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. **Node.js** (Versão 18 ou superior) — [Download Node.js](https://nodejs.org/) (Necessário apenas se for rodar nativamente)

---

## ⚡ Método A: Instalação via Docker Compose (Altamente Recomendado)
O uso do Docker é a forma mais rápida e limpa de rodar o ecossistema completo da Evolution API. Ele já inicializa a API, o Redis (cache) e o PostgreSQL de forma isolada.

### Passo 1: Ajustar a porta e redes no `docker-compose.yaml`
O arquivo `docker-compose.yaml` original contém uma rede externa chamada `dokploy-network` e tenta expor a porta `3000` (que já está em uso pelo frontend do **EstampariaPro**). 

Para evitar conflitos de porta e erros de inicialização, disponibilizamos uma versão otimizada do arquivo `docker-compose.yaml` configurada para ambiente de desenvolvimento local.

Acesse o diretório da Evolution API:
```bash
# Navegue até a pasta da Evolution API
cd evolution-api-main/evolution-api-main
```

### Passo 2: Criar o arquivo `.env` de configuração
Crie um arquivo `.env` na raiz do diretório `evolution-api-main/evolution-api-main`. Você pode copiar o exemplo disponível (`env.example`) ou criar um novo com as configurações seguras e funcionais recomendadas para o EstampariaPro:

```env
# ===========================================
# EVOLUTION API - CONFIGURAÇÃO LOCAL
# ===========================================
SERVER_NAME=GomeszSpeedPrint
SERVER_TYPE=http
SERVER_PORT=8080
SERVER_URL=http://localhost:8080
SERVER_DISABLE_DOCS=false
SERVER_DISABLE_MANAGER=false

# CORS
CORS_ORIGIN=*
CORS_METHODS=POST,GET,PUT,DELETE
CORS_CREDENTIALS=true

# BANCO DE DADOS (PostgreSQL interno do Docker)
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://postgres:suasenhadobanco@evolution-postgres:5432/evolution_api
DATABASE_CONNECTION_CLIENT_NAME=evolution

POSTGRES_DATABASE=evolution_api
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=suasenhadobanco

DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_MESSAGE_UPDATE=true
DATABASE_SAVE_DATA_CONTACTS=true
DATABASE_SAVE_DATA_CHATS=true
DATABASE_SAVE_DATA_HISTORIC=true
DATABASE_SAVE_DATA_LABELS=true
DATABASE_SAVE_IS_ON_WHATSAPP=true
DATABASE_SAVE_IS_ON_WHATSAPP_DAYS=7
DATABASE_DELETE_MESSAGE=false

# CACHE E REDIS
CACHE_REDIS_ENABLED=true
CACHE_REDIS_URI=redis://evolution-redis:6379
CACHE_REDIS_PREFIX_KEY=evolution-cache
CACHE_REDIS_TTL=604800
CACHE_REDIS_SAVE_INSTANCES=true

CACHE_LOCAL_ENABLED=true
CACHE_LOCAL_TTL=86400

# AUTENTICAÇÃO E CHAVE API (Esta será sua Evolution API Key no CRM)
AUTHENTICATION_API_KEY=GOMESZ_API_KEY_SECURE_2026
AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=false

# DIOMA
LANGUAGE=pt-BR
LOG_LEVEL=ERROR,WARN,INFO
LOG_COLOR=true
LOG_BAILEYS=error
DEL_INSTANCE=false
DEL_TEMP_INSTANCES=true
```

### Passo 3: Inicializar os Containers
Para rodar a Evolution API com a configuração otimizada e livre de conflitos, execute o seguinte comando no terminal (dentro da pasta `evolution-api-main/evolution-api-main`):

```bash
docker compose up -d
```

> [!NOTE]
> O Docker irá baixar as imagens do PostgreSQL, Redis, Evolution API e do painel gerenciador Evolution Manager. Isso pode levar alguns minutos na primeira vez.

---

## 🛠️ Método B: Instalação Nativa (Sem Docker)
Caso prefira não usar Docker, você pode rodar a Evolution API diretamente na sua máquina usando Node.js.

### Passo 1: Instalar dependências do Node
Entre no diretório e execute a instalação dos pacotes:
```bash
cd evolution-api-main/evolution-api-main
npm install
```

### Passo 2: Banco de dados e Variáveis de Ambiente
1. Você precisará ter um banco de dados PostgreSQL ou MySQL rodando localmente no seu computador.
2. Crie uma base de dados chamada `evolution_api`.
3. Renomeie o arquivo `env.example` para `.env` e configure a variável `DATABASE_CONNECTION_URI` com a string de conexão local do seu banco de dados (ex: `postgresql://postgres:senha@localhost:5432/evolution_api`).
4. Configure a variável `AUTHENTICATION_API_KEY` com a chave que deseja usar.

### Passo 3: Executar Migrações e Gerar o Prisma
Rode o utilitário para gerar os arquivos do Prisma e criar as tabelas no seu banco local:
```bash
# Para Windows:
npm run db:deploy:win

# Para Linux/MacOS:
npm run db:deploy
```

### Passo 4: Iniciar o servidor
Execute o comando para iniciar a API em modo de desenvolvimento:
```bash
npm run dev:server
```
A API estará rodando no endereço [http://localhost:8080](http://localhost:8080).

---

## 🔌 Integrando a Evolution API ao EstampariaPro

Agora que a API está rodando localmente no endereço `http://localhost:8080`, siga os passos abaixo para conectá-la ao CRM Premium do EstampariaPro:

### 1. Configurar Credenciais
Abra o sistema EstampariaPro no seu navegador e navegue até a seção de **Configurações** (ou use a tela do CRM). Insira os seguintes dados:
- **Evolution API URL:** `http://localhost:8080`
- **Evolution API Key:** `GOMESZ_API_KEY_SECURE_2026` (ou a chave configurada no seu `.env`)
- **Evolution Instance Name:** `GomeszSpeedPrint`

### 2. Conectar o WhatsApp (Gerar QR Code)
1. Acesse a aba **`💼 Workspace (CRM)`** no topo do seu painel EstampariaPro.
2. Na timeline da agenda ou no status de conexão (no canto superior direito, onde diz "Evolution API Ativa"), clique para abrir o modal de pareamento caso o status indique desconectado.
3. A tela exibirá um **QR Code gerado em tempo real**. 
4. Abra o WhatsApp no seu smartphone, vá em **Dispositivos Conectados > Conectar um dispositivo**, e escaneie o QR Code exibido.
5. Pronto! O status mudará para verde e todas as suas conversas ativas começarão a carregar na aba **`💬 Central de Mensagens`**!

---

## 🛡️ Dicas de Segurança e Resolução de Problemas

### ❌ Erro: Port 3000 Already in Use
**Causa:** O painel gerenciador Evolution Manager tenta subir na porta `3000` por padrão no arquivo `docker-compose.yaml`, conflitando com o EstampariaPro.
**Solução:** No `docker-compose.yaml` alterado, mapeamos a porta do gerenciador para `8081` (`"8081:80"`). Acesse o painel administrativo da Evolution em: [http://localhost:8081](http://localhost:8081).

### ❌ Erro: External Network 'dokploy-network' not found
**Causa:** O compose original exige uma rede externa criada anteriormente.
**Solução:** Removemos essa dependência no compose local do desenvolvedor para que ele crie e gerencie sua própria rede `evolution-net` automaticamente.

---

> [!TIP]
> Criamos um script automatizado chamado `INICIAR_EVOLUTION_LOCAL.bat` na raiz do seu projeto. Basta clicar duas vezes nele para que ele crie a configuração `.env` e inicialize o Docker Compose automaticamente para você!
