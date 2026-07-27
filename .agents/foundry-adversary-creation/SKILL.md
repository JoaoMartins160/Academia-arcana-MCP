---
name: foundry-adversary-creation
description: Diretrizes e padrões para a criação de novos adversários em Daggerheart, utilizando benchmarks e reaproveitando features do compendium.
---

# Criação de Adversários e Consistência (Daggerheart)

Sempre que a tarefa envolver criar ou modificar a ficha de um adversário (NPC/Monstro) no Foundry VTT para o sistema Daggerheart, **você deve seguir este fluxo**.

## 1. Utilização de Benchmarks
O balanceamento numérico não deve ser feito de cabeça. O repositório contém métricas e balizas oficiais do sistema.
- Consulte o arquivo `src/tools/handlers/generation/adversary-benchmarks.ts` para entender as estatísticas básicas (HP, Stress, Thresholds de Dano, Evasion) esperadas para os adversários.
- Defina o **Tier** e a **Dificuldade** da criatura e ajuste os valores da ficha com base nas tabelas fornecidas no benchmark.

## 2. Reutilização de Features do Compendium
Para manter a consistência com o sistema oficial e reduzir duplicação de lógicas de programação no Foundry:
1. **Busca Inicial:** Antes de criar uma `Feature` (Habilidade, Ataque, Passiva) totalmente nova do zero, utilize a tool `search_compendium` (ou explore o compendium) para verificar se já existe uma feature parecida no sistema.
2. **Adaptação:** Se encontrar algo similar, utilize os mesmos jargões, custos em *Fear*, e efeitos mecânicos (ex: condições de status) da feature existente como base para a sua.
3. **Padrão de Nomeação e Descrição:** Siga as descrições limpas do sistema Daggerheart, referenciando claramente os limites (Action tokens, testes de Agility, Hope/Fear, etc.).

## 3. Criação de Novas Features
Se após a busca no compendium for determinado que uma nova mecânica deve ser criada:
- Escreva a *Feature* mantendo coerência visual e mecânica com outras habilidades do sistema (mesmas marcações HTML ou estrutura JSON utilizada nas features originais do Daggerheart).
- Submeta os comandos de criação de itens com payload correto (respeitando o `SKILL.md` de `foundry-item`).
