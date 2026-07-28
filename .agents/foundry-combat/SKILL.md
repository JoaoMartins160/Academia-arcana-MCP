---
name: foundry-combat
description: Gerenciamento do Encounter e Turnos de Combate via MCP para FoundryVTT.
---
# Skill: FoundryVTT Combat Management

## Ciclo de Vida do Combate
O Foundry gerencia o combate através do documento `Combat` e de seus respectivos `Combatant` (combatentes).
- Um encontro deve ser inicializado antes de permitir a manipulação de turnos (`start_combat`).
- Avançar o turno usa lógicas internas de `nextTurn()` e `nextRound()`. Para integrações headless (MCP), identifique endpoints ou emita comandos que acionem estes métodos de forma segura via servidor.

## Regras
- Valide sempre se há um combate ativo no momento (`get_combat_state`).
- Alterações de iniciativa envolvem atualizações diretas no Documento Embutido `Combatant` (ex: alterando a propriedade `initiative`).
- Em casos de sistemas RPG personalizados, sempre verifique o código-fonte de encontros do sistema. Pode haver mecânicas exclusivas ligadas à rolagem de iniciativa ou ao rastreamento de ação (ex: Action Tokens).
