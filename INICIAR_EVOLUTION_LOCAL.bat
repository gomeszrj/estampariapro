@echo off
title Inicializando Evolution API - EstampariaPro
echo ====================================================
echo      INICIALIZANDO EVOLUTION API LOCALMENTE
echo ====================================================
echo.
echo Entrando no diretorio da API...
cd "%~dp0evolution-api-main\evolution-api-main"
echo.
echo Verificando instalacao do Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Docker nao encontrado! Por favor, certifique-se de que o Docker Desktop esta instalado e rodando.
    echo Acesse: https://www.docker.com/products/docker-desktop/
    pause
    exit /b
)
echo Docker detectado. Inicializando os containers locais...
docker compose -f docker-compose.local.yaml up -d
echo.
echo ====================================================
echo             API INICIALIZADA COM SUCESSO!
echo ====================================================
echo.
echo [+] Evolution API URL:      http://localhost:8080
echo [+] Evolution API Key:      GOMESZ_API_KEY_SECURE_2026
echo [+] Evolution Manager UI:   http://localhost:8081
echo.
echo Insira estas credenciais nas configuracoes do CRM do EstampariaPro.
echo.
echo Pressione qualquer tecla para encerrar este assistente...
pause >nul
