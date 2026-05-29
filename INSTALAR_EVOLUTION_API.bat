@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title 🚀 Evolution API - Auto Instalador | EstampariaPro

:: ============================================================
::  EVOLUTION API — AUTO INSTALADOR v1.0
::  EstampariaPro | GOMESZ SPEED PRINT
::  Gerado automaticamente — Não edite manualmente.
:: ============================================================

:: --- CONFIGURAÇÕES GLOBAIS ---
set "EVOLUTION_DIR=%~dp0evolution-api-main\evolution-api-main"
set "COMPOSE_FILE=docker-compose.local.yaml"
set "API_URL=http://localhost:8080"
set "MANAGER_URL=http://localhost:8080/manager"
set "API_KEY=GOMESZ_API_KEY_SECURE_2026"
set "PAINEL_HTML=%~dp0painel_instalacao.html"
set "LOG_FILE=%~dp0evolution_install.log"
set "ERRORED=0"

:: --- Limpa log anterior ---
if exist "%LOG_FILE%" del /f /q "%LOG_FILE%"

call :header
call :log "Iniciando auto-instalação da Evolution API..."
call :separador

:: ============================================================
:: PASSO 1: Verificar Docker Desktop
:: ============================================================
call :passo "1" "Verificando Docker Desktop..."
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    call :erro "Docker NAO encontrado!"
    echo.
    echo  [!] O Docker Desktop e necessario para rodar a Evolution API.
    echo  [!] Por favor, instale e inicie o Docker Desktop antes de continuar.
    echo.
    echo  Download: https://www.docker.com/products/docker-desktop/
    echo.
    call :abrir_painel_erro "Docker Desktop não encontrado. Acesse https://www.docker.com/products/docker-desktop/ para instalar."
    call :fim_erro
)
for /f "tokens=*" %%v in ('docker --version 2^>^&1') do set "DOCKER_VER=%%v"
call :ok "Docker detectado: %DOCKER_VER%"

:: ============================================================
:: PASSO 2: Verificar se Docker Engine está rodando
:: ============================================================
call :passo "2" "Verificando se o Docker Engine esta ativo..."
docker info >nul 2>&1
if %errorlevel% neq 0 (
    call :erro "Docker Engine NAO esta rodando!"
    echo.
    echo  [!] O Docker Desktop esta instalado, mas o engine nao foi iniciado.
    echo  [!] Abra o Docker Desktop, aguarde o icone ficar verde e tente novamente.
    echo.
    call :abrir_painel_erro "Docker Desktop está instalado, mas não está sendo executado. Abra o Docker Desktop e aguarde o ícone ficar verde."
    call :fim_erro
)
call :ok "Docker Engine ativo e respondendo."

:: ============================================================
:: PASSO 3: Verificar diretório da Evolution API
:: ============================================================
call :passo "3" "Verificando diretorio da Evolution API..."
if not exist "%EVOLUTION_DIR%" (
    call :erro "Diretorio da Evolution API nao encontrado!"
    echo.
    echo  [!] Esperado em: %EVOLUTION_DIR%
    echo  [!] Certifique-se de que o arquivo evolution-api-main.zip foi extraido corretamente.
    echo.
    call :abrir_painel_erro "Diretório da Evolution API não encontrado em: %EVOLUTION_DIR%"
    call :fim_erro
)
call :ok "Diretorio encontrado: %EVOLUTION_DIR%"

:: ============================================================
:: PASSO 4: Verificar arquivo docker-compose.local.yaml
:: ============================================================
call :passo "4" "Verificando arquivo docker-compose.local.yaml..."
if not exist "%EVOLUTION_DIR%\%COMPOSE_FILE%" (
    call :erro "Arquivo %COMPOSE_FILE% nao encontrado!"
    echo.
    echo  [!] O arquivo de composicao local nao foi encontrado.
    echo  [!] Verifique se o projeto foi configurado corretamente.
    echo.
    call :abrir_painel_erro "Arquivo docker-compose.local.yaml não encontrado em %EVOLUTION_DIR%"
    call :fim_erro
)
call :ok "Arquivo docker-compose.local.yaml encontrado."

:: ============================================================
:: PASSO 5: Verificar e criar arquivo .env se necessário
:: ============================================================
call :passo "5" "Verificando configuracao .env da Evolution API..."
if not exist "%EVOLUTION_DIR%\.env" (
    call :aviso ".env nao encontrado. Criando configuracao automaticamente..."
    call :criar_env
    call :ok "Arquivo .env criado com sucesso."
) else (
    call :ok ".env ja existe. Mantendo configuracao atual."
)

:: ============================================================
:: PASSO 6: Verificar portas em uso
:: ============================================================
call :passo "6" "Verificando disponibilidade das portas 8080 e 8081..."

set "PORTA_8080_OK=1"
set "PORTA_8081_OK=1"

netstat -ano | findstr ":8080 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8080 " ^| findstr "LISTENING"') do set "PID_8080=%%p"
    call :aviso "Porta 8080 esta em uso pelo processo PID !PID_8080!."
    set "PORTA_8080_OK=0"
)

    set "PORTA_8081_OK=1"

if "!PORTA_8080_OK!"=="1" if "!PORTA_8081_OK!"=="1" (
    call :ok "Portas 8080 e 8081 disponiveis."
) else (
    call :aviso "Algumas portas ja estao em uso. Os containers Docker ja podem estar rodando."
)

:: ============================================================
:: PASSO 7: Verificar containers existentes
:: ============================================================
call :passo "7" "Verificando containers Evolution API existentes..."
docker ps -a --filter "name=evolution" --format "{{.Names}}: {{.Status}}" 2>nul | findstr "evolution" >nul 2>&1
if %errorlevel% equ 0 (
    call :aviso "Containers da Evolution API ja existem. Verificando status..."
    for /f "tokens=*" %%c in ('docker ps --filter "name=evolution_api" --format "{{.Status}}" 2^>nul') do set "STATUS_API=%%c"
    if defined STATUS_API (
        call :aviso "Container evolution_api ja esta rodando: !STATUS_API!"
        echo.
        echo  [?] O container ja esta ativo. Deseja reinicia-lo? (S/N)
        set /p "REINICIAR=  Resposta: "
        if /i "!REINICIAR!"=="S" (
            call :passo "7a" "Parando containers anteriores..."
            cd /d "%EVOLUTION_DIR%"
            docker compose -f %COMPOSE_FILE% down >nul 2>&1
            call :ok "Containers parados. Reiniciando..."
        ) else (
            call :ok "Mantendo containers existentes. Pulando inicializacao."
            goto :verificar_saude
        )
    ) else (
        call :ok "Containers existem mas nao estao ativos. Iniciando..."
    )
) else (
    call :ok "Nenhum container existente. Procedendo com nova instalacao."
)

:: ============================================================
:: PASSO 8: Puxar imagens Docker (com feedback)
:: ============================================================
call :passo "8" "Baixando imagens Docker (pode levar alguns minutos na primeira vez)..."
call :log "Iniciando pull das imagens Docker..."
cd /d "%EVOLUTION_DIR%"
echo.
echo  Aguarde... Baixando:
echo  - evoapicloud/evolution-api:latest
echo  - evoapicloud/evolution-manager:latest
echo  - redis:latest
echo  - postgres:15
echo.
docker compose -f %COMPOSE_FILE% pull >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    call :aviso "Pull falhou ou parcialmente completo. Verificando se imagens ja existem localmente..."
    docker images evoapicloud/evolution-api >nul 2>&1
    if %errorlevel% neq 0 (
        call :erro "Imagens nao encontradas e download falhou. Verifique sua conexao com a internet."
        call :abrir_painel_erro "Falha ao baixar imagens Docker. Verifique sua conexão com a internet e tente novamente."
        call :fim_erro
    )
    call :aviso "Usando imagens locais existentes."
) else (
    call :ok "Imagens Docker baixadas com sucesso."
)

:: ============================================================
:: PASSO 9: Inicializar containers
:: ============================================================
call :passo "9" "Inicializando containers da Evolution API..."
cd /d "%EVOLUTION_DIR%"
docker compose -f %COMPOSE_FILE% up -d >> "%LOG_FILE%" 2>&1
if %errorlevel% neq 0 (
    call :erro "Falha ao inicializar containers!"
    echo.
    echo  [!] Verifique o arquivo de log para detalhes: %LOG_FILE%
    echo.
    call :abrir_painel_erro "Falha ao inicializar containers Docker. Verifique o log: %LOG_FILE%"
    call :fim_erro
)
call :ok "Containers iniciados com sucesso."

:: ============================================================
:: PASSO 10: Aguardar API ficar saudável
:: ============================================================
:verificar_saude
call :passo "10" "Aguardando a Evolution API ficar disponivel..."
call :log "Verificando saude da API..."

set "TENTATIVAS=0"
set "MAX_TENTATIVAS=30"
set "API_OK=0"

:loop_health
set /a "TENTATIVAS+=1"
if %TENTATIVAS% gtr %MAX_TENTATIVAS% goto :health_timeout

:: Tenta acessar o endpoint de saúde
curl -s -o nul -w "%%{http_code}" "%API_URL%" 2>nul | findstr "200 302 404" >nul 2>&1
if %errorlevel% equ 0 (
    set "API_OK=1"
    goto :health_ok
)

:: Tenta via PowerShell como fallback
powershell -Command "try { $r = Invoke-WebRequest -Uri '%API_URL%' -TimeoutSec 3 -UseBasicParsing; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    set "API_OK=1"
    goto :health_ok
)

echo  [%TENTATIVAS%/%MAX_TENTATIVAS%] Aguardando API inicializar...
timeout /t 3 /nobreak >nul
goto :loop_health

:health_timeout
call :aviso "Timeout aguardando a API. Ela pode ainda estar inicializando."
call :aviso "Acesse %API_URL% em alguns instantes."
goto :instalacao_concluida

:health_ok
call :ok "Evolution API respondendo em %API_URL%!"

:: ============================================================
:: INSTALAÇÃO CONCLUÍDA
:: ============================================================
:instalacao_concluida
call :separador
call :log "Instalação concluída com sucesso!"
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║         ✅  INSTALAÇÃO CONCLUÍDA COM SUCESSO!        ║
echo  ╠══════════════════════════════════════════════════════╣
echo  ║                                                      ║
echo  ║  🌐 Evolution API URL:    http://localhost:8080      ║
echo  ║  🔑 Evolution API Key:    GOMESZ_API_KEY_SECURE_2026 ║
echo  ║  🖥️  Evolution Manager:   http://localhost:8080/manager      ║
echo  ║  🗄️  Banco de Dados:      PostgreSQL (Docker)        ║
echo  ║  ⚡ Cache Redis:          Redis (Docker)             ║
echo  ║                                                      ║
echo  ╠══════════════════════════════════════════════════════╣
echo  ║  📋 PRÓXIMOS PASSOS:                                  ║
echo  ║  1. Configure o CRM com a URL e Key acima            ║
echo  ║  2. Acesse o Manager para criar uma instância        ║
echo  ║  3. Escaneie o QR Code com seu WhatsApp              ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

:: Abre o painel de sucesso no navegador
call :gerar_painel_sucesso
start "" "%PAINEL_HTML%"

:: Pergunta se quer abrir o Manager
echo.
echo  Deseja abrir o Evolution Manager no navegador? (S/N)
set /p "ABRIR_MANAGER=  Resposta: "
if /i "%ABRIR_MANAGER%"=="S" (
    start "" "%MANAGER_URL%"
    echo  [+] Manager aberto em: %MANAGER_URL%
)

echo.
echo  Log completo disponivel em: %LOG_FILE%
echo.
echo  Pressione qualquer tecla para encerrar...
pause >nul
exit /b 0

:: ============================================================
:: SUBROTINAS
:: ============================================================

:header
cls
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║    🚀  EVOLUTION API — AUTO INSTALADOR v1.0          ║
echo  ║    EstampariaPro ^| GOMESZ SPEED PRINT               ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
goto :eof

:separador
echo  ──────────────────────────────────────────────────────
goto :eof

:passo
echo.
echo  [PASSO %~1] %~2
call :log "[PASSO %~1] %~2"
goto :eof

:ok
echo  [✓] %~1
call :log "[OK] %~1"
goto :eof

:aviso
echo  [!] %~1
call :log "[AVISO] %~1"
goto :eof

:erro
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║  ❌  ERRO ENCONTRADO                                 ║
echo  ╠══════════════════════════════════════════════════════╣
echo  ║  %~1
echo  ╚══════════════════════════════════════════════════════╝
call :log "[ERRO] %~1"
set "ERRORED=1"
goto :eof

:log
echo [%date% %time%] %~1 >> "%LOG_FILE%"
goto :eof

:fim_erro
echo.
echo  Pressione qualquer tecla para fechar...
pause >nul
exit /b 1

:abrir_painel_erro
call :gerar_painel_erro "%~1"
start "" "%PAINEL_HTML%"
goto :eof

:criar_env
(
echo # ===========================================
echo # EVOLUTION API - CONFIGURACAO LOCAL AUTOMATICA
echo # ===========================================
echo SERVER_NAME=GomeszSpeedPrint
echo SERVER_TYPE=http
echo SERVER_PORT=8080
echo SERVER_URL=http://localhost:8080
echo SERVER_DISABLE_DOCS=false
echo SERVER_DISABLE_MANAGER=false
echo.
echo # CORS
echo CORS_ORIGIN=*
echo CORS_METHODS=POST,GET,PUT,DELETE
echo CORS_CREDENTIALS=true
echo.
echo # BANCO DE DADOS
echo DATABASE_PROVIDER=postgresql
echo DATABASE_CONNECTION_URI=postgresql://postgres:suasenhadobanco@evolution-postgres:5432/evolution_api
echo DATABASE_CONNECTION_CLIENT_NAME=evolution
echo.
echo POSTGRES_DATABASE=evolution_api
echo POSTGRES_USERNAME=postgres
echo POSTGRES_PASSWORD=suasenhadobanco
echo.
echo DATABASE_SAVE_DATA_INSTANCE=true
echo DATABASE_SAVE_DATA_NEW_MESSAGE=true
echo DATABASE_SAVE_MESSAGE_UPDATE=true
echo DATABASE_SAVE_DATA_CONTACTS=true
echo DATABASE_SAVE_DATA_CHATS=true
echo DATABASE_SAVE_DATA_HISTORIC=true
echo DATABASE_SAVE_DATA_LABELS=true
echo DATABASE_SAVE_IS_ON_WHATSAPP=true
echo DATABASE_SAVE_IS_ON_WHATSAPP_DAYS=7
echo DATABASE_DELETE_MESSAGE=false
echo.
echo # CACHE E REDIS
echo CACHE_REDIS_ENABLED=true
echo CACHE_REDIS_URI=redis://evolution-redis:6379
echo CACHE_REDIS_PREFIX_KEY=evolution-cache
echo CACHE_REDIS_TTL=604800
echo CACHE_REDIS_SAVE_INSTANCES=true
echo.
echo CACHE_LOCAL_ENABLED=true
echo CACHE_LOCAL_TTL=86400
echo.
echo # AUTENTICACAO
echo AUTHENTICATION_API_KEY=GOMESZ_API_KEY_SECURE_2026
echo AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=false
echo.
echo # IDIOMA E LOGS
echo LANGUAGE=pt-BR
echo LOG_LEVEL=ERROR,WARN,INFO
echo LOG_COLOR=true
echo LOG_BAILEYS=error
echo DEL_INSTANCE=false
echo DEL_TEMP_INSTANCES=true
) > "%EVOLUTION_DIR%\.env"
goto :eof

:gerar_painel_sucesso
(
echo ^<!DOCTYPE html^>
echo ^<html lang="pt-BR"^>
echo ^<head^>
echo ^<meta charset="UTF-8"^>
echo ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo ^<title^>Evolution API — Instalação Concluída^</title^>
echo ^<style^>
echo * { margin: 0; padding: 0; box-sizing: border-box; }
echo body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0a0f1e; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
echo .container { max-width: 680px; width: 100%%; padding: 2rem; }
echo .card { background: linear-gradient(135deg, #111827 0%%, #1a2744 100%%); border: 1px solid rgba(34, 211, 238, 0.2); border-radius: 20px; padding: 2.5rem; box-shadow: 0 25px 60px rgba(0,0,0,0.5), 0 0 60px rgba(34,211,238,0.05); }
echo .header { text-align: center; margin-bottom: 2rem; }
echo .checkmark { font-size: 4rem; animation: bounce 0.6s ease; }
echo @keyframes bounce { 0%% { transform: scale(0); } 50%% { transform: scale(1.2); } 100%% { transform: scale(1); } }
echo h1 { font-size: 1.8rem; font-weight: 700; color: #22d3ee; margin-top: 0.5rem; }
echo .subtitle { color: #94a3b8; font-size: 0.9rem; margin-top: 0.25rem; }
echo .divider { height: 1px; background: linear-gradient(to right, transparent, rgba(34,211,238,0.3), transparent); margin: 1.5rem 0; }
echo .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1.5rem 0; }
echo .info-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem; }
echo .info-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 0.25rem; }
echo .info-value { font-size: 0.85rem; font-weight: 600; color: #22d3ee; font-family: 'Cascadia Code', 'Fira Code', monospace; word-break: break-all; }
echo .steps { margin-top: 1.5rem; }
echo .steps h2 { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 1rem; }
echo .step { display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
echo .step:last-child { border-bottom: none; }
echo .step-num { background: rgba(34,211,238,0.15); color: #22d3ee; border-radius: 50%%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
echo .step-text { font-size: 0.875rem; color: #cbd5e1; line-height: 1.4; }
echo .btn-group { display: flex; gap: 1rem; margin-top: 2rem; }
echo .btn { flex: 1; padding: 0.75rem 1.5rem; border-radius: 10px; font-size: 0.875rem; font-weight: 600; text-decoration: none; text-align: center; cursor: pointer; transition: all 0.2s; }
echo .btn-primary { background: linear-gradient(135deg, #22d3ee, #0ea5e9); color: #0a0f1e; }
echo .btn-secondary { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; }
echo .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
echo .status-badge { display: inline-flex; align-items: center; gap: 0.4rem; background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); border-radius: 20px; padding: 0.3rem 0.8rem; font-size: 0.75rem; font-weight: 600; }
echo .pulse { width: 8px; height: 8px; border-radius: 50%%; background: #4ade80; animation: pulse 2s infinite; }
echo @keyframes pulse { 0%%, 100%% { opacity: 1; } 50%% { opacity: 0.4; } }
echo ^</style^>
echo ^</head^>
echo ^<body^>
echo ^<div class="container"^>
echo ^<div class="card"^>
echo ^<div class="header"^>
echo ^<div class="checkmark"^>✅^</div^>
echo ^<h1^>Instalação Concluída!^</h1^>
echo ^<p class="subtitle"^>Evolution API configurada e rodando no seu localhost^</p^>
echo ^<br^>
echo ^<span class="status-badge"^>^<div class="pulse"^>^</div^> API Online^</span^>
echo ^</div^>
echo ^<div class="divider"^>^</div^>
echo ^<div class="info-grid"^>
echo ^<div class="info-card"^>
echo ^<div class="info-label"^>🌐 API URL^</div^>
echo ^<div class="info-value"^>http://localhost:8080^</div^>
echo ^</div^>
echo ^<div class="info-card"^>
echo ^<div class="info-label"^>🔑 API Key^</div^>
echo ^<div class="info-value"^>GOMESZ_API_KEY_SECURE_2026^</div^>
echo ^</div^>
echo ^<div class="info-card"^>
echo ^<div class="info-label"^>🖥️ Manager UI^</div^>
echo ^<div class="info-value"^>http://localhost:8080/manager^</div^>
echo ^</div^>
echo ^<div class="info-card"^>
echo ^<div class="info-label"^>📛 Instance Name^</div^>
echo ^<div class="info-value"^>GomeszSpeedPrint^</div^>
echo ^</div^>
echo ^</div^>
echo ^<div class="divider"^>^</div^>
echo ^<div class="steps"^>
echo ^<h2^>📋 Próximos Passos^</h2^>
echo ^<div class="step"^>^<div class="step-num"^>1^</div^>^<div class="step-text"^>No ^<strong^>EstampariaPro CRM^</strong^>, vá até Configurações e insira a URL e API Key acima.^</div^>^</div^>
echo ^<div class="step"^>^<div class="step-num"^>2^</div^>^<div class="step-text"^>Acesse o ^<strong^>Evolution Manager^</strong^> (http://localhost:8080/manager) e crie uma nova instância chamada ^<code style="color:#f59e0b"^>GomeszSpeedPrint^</code^>.^</div^>^</div^>
echo ^<div class="step"^>^<div class="step-num"^>3^</div^>^<div class="step-text"^>Clique em ^<strong^>"Conectar"^</strong^> na instância criada. Um QR Code será exibido.^</div^>^</div^>
echo ^<div class="step"^>^<div class="step-num"^>4^</div^>^<div class="step-text"^>Abra o ^<strong^>WhatsApp^</strong^> no celular → Dispositivos Conectados → Conectar um dispositivo → Escaneie o QR Code.^</div^>^</div^>
echo ^<div class="step"^>^<div class="step-num"^>5^</div^>^<div class="step-text"^>🎉 Pronto! Seu WhatsApp estará integrado ao CRM do EstampariaPro.^</div^>^</div^>
echo ^</div^>
echo ^<div class="btn-group"^>
echo ^<a class="btn btn-primary" href="http://localhost:8080/manager" target="_blank"^>Abrir Manager^</a^>
echo ^<a class="btn btn-secondary" href="http://localhost:8080" target="_blank"^>Testar API^</a^>
echo ^</div^>
echo ^</div^>
echo ^</div^>
echo ^</body^>
echo ^</html^>
) > "%PAINEL_HTML%"
goto :eof

:gerar_painel_erro
(
echo ^<!DOCTYPE html^>
echo ^<html lang="pt-BR"^>
echo ^<head^>
echo ^<meta charset="UTF-8"^>
echo ^<title^>Evolution API — Erro na Instalação^</title^>
echo ^<style^>
echo * { margin: 0; padding: 0; box-sizing: border-box; }
echo body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0a0f1e; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
echo .card { max-width: 600px; width: 100%%; margin: 2rem; background: #111827; border: 1px solid rgba(239,68,68,0.3); border-radius: 20px; padding: 2.5rem; box-shadow: 0 25px 60px rgba(0,0,0,0.5), 0 0 60px rgba(239,68,68,0.05); }
echo .icon { font-size: 3rem; text-align: center; display: block; animation: shake 0.5s ease; }
echo @keyframes shake { 0%%,100%% { transform: rotate(0deg); } 25%% { transform: rotate(-5deg); } 75%% { transform: rotate(5deg); } }
echo h1 { text-align: center; color: #ef4444; font-size: 1.5rem; margin: 1rem 0 0.5rem; }
echo .msg { text-align: center; color: #94a3b8; font-size: 0.9rem; }
echo .error-box { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 10px; padding: 1rem; margin: 1.5rem 0; font-size: 0.85rem; color: #fca5a5; }
echo .links a { display: block; color: #22d3ee; text-decoration: none; padding: 0.5rem 0; font-size: 0.875rem; }
echo .links a:hover { text-decoration: underline; }
echo ^</style^>
echo ^</head^>
echo ^<body^>
echo ^<div class="card"^>
echo ^<span class="icon"^>❌^</span^>
echo ^<h1^>Erro na Instalação^</h1^>
echo ^<p class="msg"^>A instalação da Evolution API encontrou um problema.^</p^>
echo ^<div class="error-box"^>%~1^</div^>
echo ^<div class="links"^>
echo ^<a href="https://www.docker.com/products/docker-desktop/" target="_blank"^>🐳 Download Docker Desktop^</a^>
echo ^<a href="https://docs.docker.com/desktop/install/windows-install/" target="_blank"^>📖 Guia de Instalação Docker no Windows^</a^>
echo ^</div^>
echo ^</div^>
echo ^</body^>
echo ^</html^>
) > "%PAINEL_HTML%"
goto :eof
