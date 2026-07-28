---
name: foundry-item
description: Manipulação de Itens, equipamentos e inventário (Embedded Documents) no FoundryVTT.
---
# Skill: FoundryVTT Item Management

## Contexto de Itens
- Itens no FoundryVTT podem existir como entidades primárias no mundo (`game.items`) ou como Documentos Embutidos dentro de um Ator (`actor.items`).

## Manipulando Itens de Atores (`create_actor_item`, `update_actor_item`)
- Para criar um item no inventário de um Ator via Socket.io, utilize chamadas equivalentes a `modifyDocument("Item", "create", { data: itemData, parent: actorId })` garantindo que o `parent` ou o `parentUuid` esteja devidamente populado para apontar ao ator.
- **Pesquisa de Código Fonte**: Se estiver adicionando itens para um sistema específico como Daggerheart, acesse a estrutura real do item na pasta do sistema (`template.json` ou construtores de classe de item) para garantir a integridade dos dados (`system.damage`, `system.trait`, etc.).
- Nunca envie estruturas imprecisas ou incompletas para itens complexos. O client do FoundryVTT pode não renderizar a ficha do item adequadamente se faltarem propriedades em `system`.
