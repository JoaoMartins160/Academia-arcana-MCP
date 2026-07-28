# Diretrizes e Regras de Desenvolvimento (MCP FoundryVTT)

Este documento contém as regras estritas de desenvolvimento, documentações oficiais que devem ser seguidas e a estrutura de pastas do projeto para manter a organização e a consistência do servidor MCP.

## Documentação Oficial

Durante o desenvolvimento ou adição de novas ferramentas, as seguintes documentações devem ser rigorosamente respeitadas:

### 1. Foundry VTT API
**Versão Atual:** Foundry V14 (Build 364)
**Link:** [https://foundryvtt.com/api/index.html](https://foundryvtt.com/api/index.html)

**Índice da Documentação (Table of Contents):**
- **Reading these API Docs**
- **Documents and Data:** Document Abstraction, Database Operations, Collections
- **Primary Document Types:** Actor, Adventure, Cards, Chat Message, Combat Encounter, Fog Exploration, Folder, Item, Journal Entry, Macro, Playlist, Rollable Table, Scene, Setting, User
- **Embedded Document Types:** Active Effect, Actor Delta, Ambient Light, Ambient Sound, Card, Combatant, Combatant Group, Drawing, Journal Entry Category, Journal Entry Page, Note, Playlist Sound, Region, Region Behavior, Table Result, Tile, Token, Wall
- **The Game Canvas:** Canvas Building Blocks, Canvas Layers, Canvas Objects, HUD Overlay
- **User Interface:** Application Building Blocks
- **Dice Rolling:** Roll Term Types, Dice Types

**Foco Especial: Journals (Criação, Edição, Reorganização)**
Devido à importância dos Journals para esta implementação, consulte e utilize estritamente as seguintes referências e classes ao criar, editar, apagar ou reorganizar Entradas de Diário e suas Páginas:
- [BaseJournalEntry](https://foundryvtt.com/api/classes/foundry.documents.BaseJournalEntry.html)
- [JournalEntry](https://foundryvtt.com/api/classes/foundry.documents.JournalEntry.html)
- [Journal (Collection)](https://foundryvtt.com/api/classes/foundry.documents.collections.Journal.html)
- [JournalEntrySheet](https://foundryvtt.com/api/classes/foundry.applications.sheets.journal.JournalEntrySheet.html)
- [JournalDirectory](https://foundryvtt.com/api/classes/foundry.applications.sidebar.tabs.JournalDirectory.html)

**Regras:**
- **Manipulação de Dados:** Sempre use as estruturas de dados nativas do Foundry VTT. Ao enviar comandos via Socket.IO (por exemplo, `modifyDocument`), os dados devem estar perfeitamente formatados para que o Foundry os processe adequadamente (ex: usar classes `Roll`, `Die`, `NumericTerm` serializadas em JSON em vez de forjar HTML manual no chat).
- **Exclusividade do Socket.IO:** A API REST foi descontinuada do projeto. Todo o fluxo de dados (leitura e gravação) com o FoundryVTT DEVE usar a conexão WebSocket já estabelecida via `client.ts` (`this.emitWithAck`).
- **Remoção de Código Obsoleto:** Qualquer menção ou resquício de `FOUNDRY_API_KEY` ou "REST API module" que for encontrado no código ou nas skills deve ser ativamente refatorado/removido.

### 2. Daggerheart System
**Link:** [https://github.com/Foundryborne/daggerheart/wiki](https://github.com/Foundryborne/daggerheart/wiki)

**Regras:**
- **Mecânicas e Rolagens:** As rolagens específicas do sistema Daggerheart (ex: Hope/Fear, 2d12) devem aderir estritamente às regras documentadas na wiki do sistema e gerar os modificadores, cálculos e resultados com precisão.

---

## Estrutura do Projeto

Abaixo está o índice e estrutura de diretórios da pasta base `src/`, onde reside o código-fonte principal:

```text
D:\FOUNDRY\FOUNDRYVTT-MCP\SRC
|   index.ts                   # Ponto de entrada principal do servidor MCP
|   
+---character
|       manager.ts             # Lógica relacionada a gerenciar personagens específicos
|       
+---combat
|       manager.ts             # Lógica e utilitários focados em encontros e turnos de combate
|       
+---config
|   |   index.ts               # Carregamento de variáveis de ambiente e configurações gerais
|   |   
|   \---__tests__
|           index.test.ts
|           
+---diagnostics
|   |   client.ts              # Cliente auxiliar para diagnóstico e validação do sistema
|   |   types.ts               
|   |   
|   \---__tests__
|           client.test.ts
|           
+---foundry
|   |   auth.ts                # Autenticação (REST/Socket.io) no Foundry
|   |   client.ts              # Cliente principal que estabelece comunicação (Socket/HTTP) com Foundry
|   |   types.ts               # Tipagens TypeScript para os modelos do FoundryVTT
|   |   
|   \---__tests__
|           auth.test.ts
|           client.test.ts
|           types.test.ts
|           
+---tools
|   |   base.ts                # Definição base das Ferramentas MCP (Tools)
|   |   definitions.ts         # Metadados e declaração dos esquemas (input/output) das ferramentas
|   |   index.ts               # Ponto de exportação do módulo de ferramentas
|   |   new-router.ts          
|   |   registry.ts            # Registro de Tools suportadas e injeção de dependências
|   |   resources.ts           
|   |   router.ts              # Roteador central que despacha chamadas MCP para o respectivo Handler
|   |   
|   +---handlers               # Contém a implementação real (ação) de cada tool individual
|   |   |   actor-mutations.ts
|   |   |   actors.ts
|   |   |   chat.ts
|   |   |   combat-mutations.ts
|   |   |   combat.ts
|   |   |   compendium.ts
|   |   |   diagnostics.ts
|   |   |   dice.ts            # Implementações como roll_dice, roll_daggerheart
|   |   |   generation.ts
|   |   |   item-mutations.ts
|   |   |   items.ts
|   |   |   journals.ts
|   |   |   resources.ts
|   |   |   scenes.ts
|   |   |   token-mutations.ts
|   |   |   users.ts
|   |   |   utils.ts
|   |   |   world.ts
|   |   |   
|   |   \---__tests__
|   |           ... (Testes unitários dos handlers)
|   |           
|   \---__tests__
|           registry.test.ts
|           
+---utils
|   |   cache-instance.ts      # Instância de cache
|   |   cache.ts               # Mecanismo de cache genérico
|   |   diagnostics.ts         # Funcionalidades utilitárias para diagnóstico
|   |   logger.ts              # Wrapper de Log para o servidor MCP
|   |   
|   \---__tests__
|           cache.test.ts
|           logger.test.ts
|           
\---__tests__
        integration.test.ts    # Testes de integração gerais
```

### Convenções e Boas Práticas Adicionais:
1. **Padrão de Handlers:** Qualquer nova funcionalidade adicionada como ferramenta (Tool) MCP deve ser mapeada em `tools/router.ts` (ou registro) e seu comportamento contido de forma atômica em um arquivo na pasta `tools/handlers/`.
2. **Tipagem:** Utilize e expanda as interfaces de `src/foundry/types.ts` sempre que lidar com dados desconhecidos vindos da resposta JSON do FoundryVTT.
3. **Logs:** Utilize `import { logger } from '../utils/logger.js'` para registrar eventos ou erros com os níveis adequados (`debug`, `info`, `warn`, `error`).
4. **Nomenclatura de Arquivos (Exata e Snake Case):** Todos os arquivos de código devem utilizar nomes descritivos e exatos referentes ao que realizam no sistema. É estritamente proibido utilizar nomes genéricos como `index.ts`, `types.ts`, `adapter.ts`, `filters.ts` ou `index-builder.ts`. Utilize obrigatoriamente a convenção `snake_case` em todos os módulos e subdiretórios (ex: `system_registry_initializer.ts`, `system_registry.ts`, `compendium_index_builder_registry.ts`, `daggerheart_system_adapter.ts`, `daggerheart_filters.ts`, `daggerheart_compendium_index_builder.ts`).


---

## Skills e Regras de Inspeção de Código Fonte

### 1. Pesquisa no Código Fonte do Sistema
Sempre que for implementar ou corrigir uma funcionalidade que dependa de mecânicas do sistema de RPG ativo (por exemplo, `daggerheart`), **é estritamente obrigatório pesquisar o código-fonte original do sistema**.
- **Diretório:** Acesse `d:\Foundry\daggerheart` (ou equivalente) para ler os arquivos de código.
- **Objetivo:** Verificar como os payloads são construídos, quais são os argumentos esperados pelos construtores (ex: `DualityRoll.build`), e como as informações do sistema são persistidas no FoundryVTT. 
- **Regra:** Nunca assuma a estrutura de um payload. Busque pela implementação nativa (ex: comandos de chat, construtores) no código fonte do sistema para replicar exatamente o mesmo comportamento.

### 2. Uso de Skills Específicas
Ao atuar em diferentes domínios dentro do MCP (Atores, Diários, Itens, Combate), utilize as skills locais desenvolvidas para este projeto. O agente deve realizar a leitura (via `view_file`) da documentação da skill pertinente antes de iniciar o desenvolvimento.
As skills estão localizadas no diretório `.agents/` na raiz do repositório:

- **`.agents/foundry-actor/SKILL.md`**: Implementação e manipulação de Atores (`create_actor`, atributos, `update_actor`).
- **`.agents/foundry-journal/SKILL.md`**: Criação, busca e organização de Entradas de Diário e Páginas.
- **`.agents/foundry-item/SKILL.md`**: Criação e modificação de Itens de Atores.
- **`.agents/foundry-combat/SKILL.md`**: Gerenciamento e controle de encontros de combate (`start_combat`, `next_turn`, etc).
- **`.agents/foundry-creature-conversion/SKILL.md`**: Conversão de fichas de criaturas de outros sistemas (PF2e, Tormenta 20, D&D 5e) para o Daggerheart.
- **`.agents/foundry-adversary-creation/SKILL.md`**: Criação de adversários de Daggerheart usando dados do `adversary-benchmarks.ts` e reaproveitamento de features do compendium para consistência.
- **`.agents/foundry-zod-typing/SKILL.md`**: Diretrizes rigorosas para modularização por domínio, validação via Zod e erradicação de `any` ou `Record<string, unknown>` em handlers do MCP.
- **`.agents/gitflow-workflow/SKILL.md`**: Regras e etapas de Gitflow Real no projeto, com padronização de branching, rebase, commits convencionais e tags de versão.

### 3. Dumps e Scripts Temporários
Ao inspecionar o estado bruto dos atores, itens ou qualquer outro documento (via scripts auxiliares) que gere saídas extensas:
- **Salvar Scripts**: Qualquer script auxiliar de inspeção ou "dump" deve ser armazenado na pasta `dumps/scripts`.
- **Salvar JSONs**: O resultado da extração (os arquivos `.json`) deve ser salvo diretamente na pasta `dumps/json`.
- **Regra**: Não polua a raiz do projeto ou o diretório principal `src/` com dados temporários e não inclua saídas extensas de log na raiz.
