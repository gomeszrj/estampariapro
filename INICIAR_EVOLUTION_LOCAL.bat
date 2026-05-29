@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title ▶ Iniciar Evolution API | EstampariaPro

:: ============================================================
::  INICIAR EVOLUTION API — Inicio Rapido
::  Usa para quando a API ja foi instalada antes.
::  Para primeira instalacao, use: INSTALAR_EVOLUTION_API.bat
:: ============================================================

set "EVOLUTION_DIR=%~dp0evolution-api-main\evolution-api-main"
set "COMPOSE_FILE=docker-compose.local.yaml"
set "API_URL=http://localhost:8080"
set "MANAGER_URL=http://localhost:8080/manager"

cls
echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║   ▶  INICIALIZANDO EVOLUTION API                    ║
echo  ║   EstampariaPro ^| GOMESZ SPEED PRINT               ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

:: Verifica Docker
echo  [1/3] Verificando Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ╔══════════════════════════════════════════════════════╗
    echo  ║  ❌ Docker nao esta ativo!                           ║
    echo  ║  Abra o Docker Desktop e aguarde o icone verde.     ║
    echo  ╚══════════════════════════════════════════════════════╝
    echo.
    echo  Primeira vez? Execute: INSTALAR_EVOLUTION_API.bat
    echo.
    pause
    exit /b 1
)
echo  [✓] Docker OK

:: Entra no diretório e inicia
echo  [2/3] Iniciando containers...
cd /d "%EVOLUTION_DIR%"
docker compose -f %COMPOSE_FILE% up -d >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] Erro ao iniciar. Tentando com rebuild...
    docker compose -f %COMPOSE_FILE% up -d --remove-orphans
    if %errorlevel% neq 0 (
        echo.
        echo  [ERRO] Falha ao iniciar containers.
        echo  Execute INSTALAR_EVOLUTION_API.bat para reinstalar.
        pause
        exit /b 1
    )
)
echo  [✓] Containers iniciados

:: Status final
echo  [3/3] Verificando status...
timeout /t 3 /nobreak >nul
for /f "tokens=*" %%s in ('docker ps --filter "name=evolution_api" --format "Status: {{.Status}}" 2^>nul') do echo  [✓] %%s

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║         ✅  EVOLUTION API ATIVA!                    ║
echo  ╠══════════════════════════════════════════════════════╣
echo  ║  🌐 API URL:     http://localhost:8080              ║
echo  ║  🔑 API Key:     GOMESZ_API_KEY_SECURE_2026         ║
echo  ║  🖥️  Manager:    http://localhost:8080/manager      ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  Pressione qualquer tecla para encerrar...
pause >nul
