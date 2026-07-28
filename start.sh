#!/usr/bin/env bash

# ==============================================================================
# Script de Inicialização Automatizada — Academia-arcana-MCP
# ==============================================================================

set -e

echo "🔮 [Academia-arcana-MCP] Iniciando script de ambiente..."

# 1. Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não foi encontrado. Por favor, instale o Node.js v18+ para continuar."
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js detectado: $NODE_VERSION"

# 2. Verificar e criar .env
if [ ! -f ".env" ]; then
    echo "⚠️ Arquivo .env não encontrado. Copiando de .env.example..."
    cp .env.example .env
    echo "📝 Arquivo .env criado! Lembre-se de configurar as credenciais do seu Foundry VTT no arquivo .env."
fi

# 3. Instalar dependências se node_modules não existir
if [ ! -d "node_modules" ]; then
    echo "📦 Diretório node_modules não encontrado. Executando 'npm install'..."
    npm install
else
    echo "✅ Dependências (node_modules) já instaladas."
fi

# 4. Iniciar o servidor MCP
echo "🚀 Iniciando o servidor MCP em modo de desenvolvimento..."
npm run dev
