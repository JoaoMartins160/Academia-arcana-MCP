---
name: foundry-creature-conversion
description: Diretrizes e mapeamentos para converter fichas de criaturas e adversários de sistemas como PF2e, Tormenta 20 e D&D 5e para o Daggerheart, garantindo consistência e balanceamento.
---

# Conversão de Criaturas (PF2e, T20, D&D 5e -> Daggerheart)

Sempre que a tarefa envolver importar, traduzir ou adaptar estatísticas de um NPC/Monstro dos sistemas Pathfinder 2e (PF2e), Tormenta 20 (T20) ou D&D 5e para o sistema Daggerheart, **obrigatoriamente siga as instruções deste documento**.

## 1. Mapeamento de Escala de Dificuldade
Daggerheart agrupa as ameaças em "Tiers" que escalam com o nível do grupo. Identifique o nível da criatura no sistema original e mapeie de acordo com a progressão recomendada no Daggerheart:
- **Níveis 1-4 (D&D/PF2e):** Tier 1 no Daggerheart
- **Níveis 5-8 (D&D/PF2e):** Tier 2 no Daggerheart
- **Níveis 9+ (D&D/PF2e):** Tier 3 no Daggerheart (ou "Boss/Legendary")

Utilize o `adversary-benchmarks.ts` (ou a referência do sistema) para descobrir os limites exatos (Evasion, HP, Stress) do Tier selecionado.

## 2. Tradução de Atributos e Defesas
Os sistemas clássicos baseados na OGL possuem 6 atributos e Classes de Armadura (AC). Em Daggerheart, a conversão deve observar a identidade mecânica:
- **CA / Defesa alta:** Resulta em valores elevados de *Evasion* ou na concessão de *Armor* ou *Resistências Específicas* (Physical/Magical) como features passivas.
- **Força / Constituição altas:** A criatura terá Limiares de Dano (*Damage Thresholds*) mais robustos (ex: Major e Severe aumentados) ou HP um pouco acima da média do seu Tier.
- **Resistências a Magia / Testes de Salvamento:** Daggerheart gerencia isso pela mecânica de *Stress* ou Habilidades Passivas (ex: Habilidade que ignora um ponto de Stress por rodada, ou gasta Fear para absorver dano mágico).

## 3. Adaptação de Habilidades Especiais (Features)
- Não copie descrições 1:1. Simplifique a linguagem mecânica.
- Ao converter Ataques (ex: Multiattack do D&D, Action Economy do PF2e), adapte para o uso de fichas de Ação (Action tokens) do Daggerheart ou para custos em *Fear*.
- Em vez de uma criatura ter "3 ataques por rodada", crie ataques mais impactantes, ou uma Feature que diz "Ao atacar, pode gastar 1 Fear para realizar um ataque adicional".

## 4. Consistência com o Compendium
Após desenhar a ficha teórica da criatura adaptada, siga estritamente a skill `foundry-adversary-creation` para:
- Consultar o compendium do Foundry VTT.
- Garantir que as Habilidades Adaptadas reaproveitem a lógica e o texto de features já existentes no sistema.
