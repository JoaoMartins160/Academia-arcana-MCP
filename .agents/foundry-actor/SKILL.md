---
name: foundry-actor
description: Diretrizes e padrões para implementar Atores (Actors) no servidor MCP para FoundryVTT.
---
# Skill: FoundryVTT Actor Management

## Diretrizes Gerais
- Atores representam os personagens, monstros ou NPCs no FoundryVTT.
- Utilize a coleção primária de `game.actors` e o tipo principal `Actor` ao lidar com a documentação do Foundry.
- Ao modificar atributos (HP, stress, stats), verifique a estrutura do `system` do ator utilizando a inspeção de código-fonte recomendada.

## Integração com Sistemas de RPG (ex: Daggerheart)
- **Criação de Ator (`create_actor`)**: Sempre analise os modelos de dados e `template.json` do sistema (localizado em `d:\Foundry\daggerheart` ou equivalente) para descobrir quais são os campos padrões e obrigatórios do objeto `system` do ator.
- **Payloads**: Nunca assuma que propriedades arbitrárias funcionarão. Utilize as chaves corretas como `system.attributes.hp.value` se essa for a estrutura adotada pelo sistema de jogo.
- **Uso de Ferramentas**: Considere testar com o cliente via socket (`modifyDocument`) enviando os dados estritamente validados.
