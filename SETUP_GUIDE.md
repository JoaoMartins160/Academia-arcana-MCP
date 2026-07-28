# Guia de Configuração — Academia-arcana-MCP

Este guia orienta o processo de instalação, configuração de ambiente e conexão do servidor **Academia-arcana-MCP** ao seu Foundry VTT.

---

## ⚡ Início Rápido

### Opção A: Inicialização Automatizada (Recomendado)

Você pode usar os scripts de inicialização única que verificam o Node.js, criam o `.env` e instalam as dependências automaticamente:

- **Linux / macOS / Git Bash**:
  ```bash
  chmod +x start.sh
  ./start.sh
  ```
- **Windows (PowerShell)**:
  ```powershell
  .\start.ps1
  ```

---

### Opção B: Passo a Passo Manual

1. **Clonar e Instalar Dependências**:
   ```bash
   git clone https://github.com/JoaoMartins160/Academia-arcana-MCP.git
   cd Academia-arcana-MCP
   npm install
   ```

2. **Criar Arquivo de Configuração de Ambiente**:
   ```bash
   cp .env.example .env
   ```

3. **Configurar Conexão no `.env`** (veja as opções abaixo).

4. **Executar o Servidor em Modo de Desenvolvimento**:
   ```bash
   npm run dev
   ```

---

## 🔌 Configuração de Conexão com o Foundry VTT

O servidor MCP se conecta diretamente ao Foundry VTT via protocolo **WebSocket (Socket.IO)** utilizando as credenciais de um usuário cadastrado no jogo. Não é necessário instalar nenhum módulo adicional no Foundry VTT.

### Pré-requisitos
- Servidor Foundry VTT (Versão V14 Build 364 ou superior) em execução.
- Um **mundo ativo carregado** no Foundry VTT (a conexão não funcionará na tela de seleção de mundos / setup).
- Um usuário criado no Foundry VTT com permissão de **Assistant GM** ou **GM**.

---

## 🛠️ Opções de Configuração no `.env`

### Configuração Local (Desenvolvimento Padrão)
```env
FOUNDRY_URL=http://localhost:30000
FOUNDRY_USERNAME=mcp-assistant
FOUNDRY_PASSWORD=sua_senha_aqui
FOUNDRY_WRITE_ENABLED=true
LOG_LEVEL=info
```

### Configuração por IP de Rede Local
```env
FOUNDRY_URL=http://192.168.1.100:30000
FOUNDRY_USERNAME=mcp-assistant
FOUNDRY_PASSWORD=sua_senha_aqui
FOUNDRY_WRITE_ENABLED=true
```

### Configuração via Proxy Reverso / Domínio Remoto (HTTPS / SSL)
```env
FOUNDRY_URL=https://foundry.meudominio.com
FOUNDRY_USERNAME=mcp-assistant
FOUNDRY_PASSWORD=sua_senha_aqui
FOUNDRY_WRITE_ENABLED=true
```

---

## 🔑 A Importância da Flag `FOUNDRY_WRITE_ENABLED`

- **`FOUNDRY_WRITE_ENABLED=false` (Padrão de Segurança)**: O servidor MCP operará em **modo somente leitura** (Read-Only). Ferramentas que tentarem modificar atores, criar diários, alterar o combate ou mover tokens retornarão um erro informando que as operações de gravação estão desativadas.
- **`FOUNDRY_WRITE_ENABLED=true`**: Permite que o servidor MCP envie comandos de mutação via protocolo `modifyDocument` no Socket.IO. Requer que o usuário conectado tenha permissão de escrita/propriedade nos documentos afetados.

---

## 🤖 Configurando Clientes MCP

### Claude Desktop

Edite o arquivo de configuração do Claude Desktop (`claude_desktop_config.json`):

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "Academia-arcana-MCP": {
      "command": "node",
      "args": ["d:/Foundry/Academia-arcana-MCP/dist/index.js"],
      "env": {
        "FOUNDRY_URL": "http://localhost:30000",
        "FOUNDRY_USERNAME": "mcp-assistant",
        "FOUNDRY_PASSWORD": "sua_senha_aqui",
        "FOUNDRY_WRITE_ENABLED": "true"
      }
    }
  }
}
```

---

## 🧪 Verificação da Instalação e Testes

Após a configuração, execute os comandos de validação do projeto:

```bash
# Executar a verificação de linter e formatação de código
npx biome check src/

# Executar a verificação do compilador TypeScript
npx tsc --noEmit

# Executar os testes unitários da suíte de sistemas e handlers
npm test
```
