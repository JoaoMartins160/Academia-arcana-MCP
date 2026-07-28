# Script de Inicialização Automatizada (PowerShell) — Academia-arcana-MCP

$ErrorActionPreference = "Stop"

Write-Host "🔮 [Academia-arcana-MCP] Iniciando script de ambiente..." -ForegroundColor Cyan

# 1. Verificar Node.js
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js não foi encontrado. Por favor, instale o Node.js v18+ para continuar." -ForegroundColor Red
    exit 1
}

$nodeVersion = node -v
Write-Host "✅ Node.js detectado: $nodeVersion" -ForegroundColor Green

# 2. Verificar e criar .env
if (-not (Test-Path ".env")) {
    Write-Host "⚠️ Arquivo .env não encontrado. Copiando de .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "📝 Arquivo .env criado! Lembre-se de configurar as credenciais do seu Foundry VTT no arquivo .env." -ForegroundColor Yellow
}

# 3. Instalar dependências se node_modules não existir
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Diretório node_modules não encontrado. Executando 'npm install'..." -ForegroundColor Cyan
    npm install
} else {
    Write-Host "✅ Dependências (node_modules) já instaladas." -ForegroundColor Green
}

# 4. Iniciar o servidor MCP
Write-Host "🚀 Iniciando o servidor MCP em modo de desenvolvimento..." -ForegroundColor Cyan
npm run dev
