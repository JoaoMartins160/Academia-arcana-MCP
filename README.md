# Academia-arcana-MCP — Servidor MCP para Foundry VTT

[![Versão](https://img.shields.io/badge/vers%C3%A3o-1.1.0-blue.svg)](CHANGELOG.md)
[![Licença: MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-yellow.svg)](LICENSE)

Servidor **Model Context Protocol (MCP)** avançado para integração local e direta com o **Foundry VTT (Versão V14 Build 364)** via comunicação nativa WebSocket (Socket.IO). Permite que assistentes de Inteligência Artificial (como Claude Desktop, VS Code, Antigravity) interajam, leiam e mutem o estado das suas sessões de RPG em tempo real usando linguagem natural.

---

## 🌟 Principais Recursos

- **Conexão Nativa WebSocket (Socket.IO)**: Conecta-se diretamente ao mundo ativo do Foundry VTT sem a necessidade de APIs REST legadas ou módulos customizados de terceiros.
- **Suporte Nativo ao Sistema Daggerheart (v1.1.0)**:
  - Rolagens estendidas de Duality (2d12 Hope vs Fear) com Vantagem/Desvantagem e acertos críticos.
  - Cálculo automatizado de danos comparados com **Damage Thresholds (Minor/Major/Severe)** e mitigação via **Armor Slots**.
  - Gerenciamento dinâmico de turnos sem iniciativa via **Action Tracker / Action Tokens**.
  - Construtor completo de personagens (PC Builder) e adversários (Tier 0 a 4).
  - Busca inteligente em compêndios de Daggerheart por nível, classe, domínio e raridade.
  - Automação via **Action Graphs** e **Macro Pipelines** (`daggerheart_pipeline_encounter_setup`, `daggerheart_pipeline_full_character_onboarding`).
- **Módulo Dedicado para D&D 5e**: Estrutura de sistema isolada em `src/systems/dnd5e/` (`Dnd5eSystemAdapter`, `Dnd5eIndexBuilder`, `Dnd5eCharacterManager`, `Dnd5eCombatManager`).
- **Ferramentas Gerais do Foundry VTT**: Busca, inspeção e mutação de Atores, Itens, Cenas, Diários, Combates, Tokens e Histórico de Chat.
- **Mutações Seguras de Estado**: Operações de gravação protegidas pela flag `FOUNDRY_WRITE_ENABLED=true` utilizando o protocolo seguro `modifyDocument`.
- **Recursos MCP (`foundry://`)**: Acesso direto a URIs de dados brutos (`foundry://actors`, `foundry://scenes/current`, `foundry://journals`).

---

## 🏗️ Arquitetura do Projeto (Clean Architecture por Sistema)

O projeto organiza as ferramentas de MCP dividindo rigorosamente as capacidades nativas do Foundry VTT das regras específicas de cada sistema de RPG:

```text
src/
├── systems/                          # Módulos de Sistemas de RPG
│   ├── daggerheart/                  # Módulo Daggerheart (Ferramentas, Router, Handlers e Schemas Zod)
│   │   └── tools/
│   │       ├── daggerheart_definitions.ts
│   │       ├── daggerheart_router.ts
│   │       └── handlers/             # subpastas por domínio (actor, combat, compendium, dice, etc.)
│   │
│   └── dnd5e/                        # Módulo D&D 5e (Adapter, IndexBuilder, Managers)
│       ├── dnd5e_system_adapter.ts
│       ├── dnd5e_character_manager.ts
│       └── dnd5e_combat_manager.ts
│
└── tools/                            # Ferramentas GERAIS / NATIVAS do Foundry VTT
    ├── definitions.ts                # Definições Core do Foundry VTT
    ├── router.ts                     # Roteador central que delega ferramentas por sistema
    └── handlers/                     # Handlers nativos (actor, chat, combat, item, journal, scene, etc.)
```

---

## 🚀 Inicio Rápido

### Pré-requisitos

- **Node.js 18+** instalado.
- Servidor **Foundry VTT (V14+)** rodando localmente ou remotamente com um **mundo ativo** carregado.
- Cliente IA compatível com MCP (Claude Desktop, VS Code, etc.).

### Configuração Recomendada de Usuário no Foundry VTT

Para melhor auditoria e segurança:
1. No Foundry VTT, acesse **Configurações** → **Gerenciamento de Usuários**.
2. Crie um usuário dedicado para a IA (ex: `mcp-assistant`).
3. Atribua o papel de **Assistant GM** ou **GM** (necessário para ler dados do mundo e realizar mutações via `modifyDocument`).

### Configuração do Cliente MCP

No seu arquivo de configuração do cliente MCP (ex: `claude_desktop_config.json` ou `.mcp.json`):

```json
{
  "mcpServers": {
    "foundryvtt": {
      "command": "node",
      "args": ["d:/Foundry/Academia-arcana-MCP/dist/index.js"],
      "env": {
        "FOUNDRY_URL": "http://localhost:30000",
        "FOUNDRY_USERNAME": "mcp-assistant",
        "FOUNDRY_PASSWORD": "sua_senha_aqui",
        "FOUNDRY_WRITE_ENABLED": "true",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

---

## ⚙️ Variáveis de Ambiente (`.env`)

| Variável | Obrigatório | Descrição | Padrão |
| :--- | :---: | :--- | :---: |
| `FOUNDRY_URL` | **Sim** | URL base do servidor Foundry VTT (ex: `http://localhost:30000`) | - |
| `FOUNDRY_USERNAME` | **Sim** | Nome do usuário cadastrado no Foundry VTT | - |
| `FOUNDRY_PASSWORD` | **Sim** | Senha do usuário do Foundry VTT | - |
| `FOUNDRY_WRITE_ENABLED` | Não | Habilita mutações no jogo (`true` para criar/editar atores, diários, combates) | `false` |
| `LOG_LEVEL` | Não | Nível de log (`debug`, `info`, `warn`, `error`) | `info` |
| `FOUNDRY_TIMEOUT` | Não | Timeout da conexão WebSocket em milissegundos | `10000` |

---

## 🧰 Ferramentas MCP Disponíveis

### ⚔️ Sistema Daggerheart (`daggerheart_*`)
- `daggerheart_roll_duality_extended` — Rolagem estendida 2d12 Duality (Hope/Fear, Vantagem/Desvantagem, Críticos).
- `daggerheart_apply_damage_with_thresholds` — Aplicação de dano contra limiares (Minor/Major/Severe) e Armor Slots.
- `daggerheart_manage_action_tracker` — Controle e mutação de Action Tokens no Action Tracker de combate.
- `daggerheart_create_character` — Construtor e onboarding completo de personagens (Ancestry, Community, Class, Domain Cards).
- `daggerheart_invoke_experience` — Invocação de experiências (+1/+2) em rolagens de Duality.
- `daggerheart_search_compendium` — Busca refinada em compêndios de Daggerheart.
- `daggerheart_execute_action_graph` — Execução de grafos de ações encadeadas com resolução de variáveis.
- `daggerheart_pipeline_encounter_setup` — Macro pipeline para criação de encontro completo (Inimigo + Cena + Diário de Quest).
- `daggerheart_pipeline_full_character_onboarding` — Macro pipeline para onboarding de personagem em 1 clique.
- `daggerheart_create_quest_journal` — Criação de diários de missões e contratos formatados.
- `daggerheart_create_campaign_dashboard` — Painel de controle de campanha com marcadores de Hope/Fear e Relógio de Eventos.
- `daggerheart_create_adversary_spec` — Criação rápida de fichas de adversários por Tier (0 a 4).
- `daggerheart_get_combat_tactical_context` — Visão tática de combate com bandas de distância (*Melee, Very Close, Close, Far, Very Far*).
- `daggerheart_modify_combat_resources` — Ajuste rápido de HP, Stress, Hope, Fear e Armor Slots.
- `daggerheart_manage_domain_cards` — Adição e gerenciamento de cartas de domínio.
- `daggerheart_roll_table` — Rolagem em tabelas expansíveis do Daggerheart.
- `daggerheart_manage_scene_environment` — Controle de iluminação, escuridão atmosférica e notas da cena.

### 🛡️ Ferramentas Gerais do Foundry VTT
- `search_actors` / `get_actor_details` — Busca e inspeção detalhada de atores/NPCs.
- `update_actor_attributes` / `create_actor_item` — Atualização de atributos e itens.
- `search_items` — Consulta de equipamentos, magias e itens.
- `get_combat_state` / `next_turn` / `set_initiative` — Controle de combate geral.
- `get_scene_info` / `move_token` — Inspeção e movimentação de tokens na cena.
- `search_journals` / `create_journal` — Leitura e criação de entradas de diário.
- `roll_dice` — Rolagem de dados na notação padrão de RPG.

---

## 💻 Desenvolvimento Local & Qualidade

Para desenvolver ou contribuir com o projeto:

```bash
# Instalar dependências
npm install

# Rodar o servidor em modo de desenvolvimento (watch mode)
npm run dev

# Executar a suíte de testes unitários
npm test

# Executar a verificação de lint e formatação
npx biome check src/

# Checar a compilação do TypeScript
npx tsc --noEmit
```

---

## 📜 Licença

Este projeto é distribuído sob a licença [MIT](LICENSE).
