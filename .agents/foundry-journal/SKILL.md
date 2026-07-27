---
name: foundry-journal
description: Padrões de implementação e manipulação de Diários (Journals) no FoundryVTT.
---
# Skill: FoundryVTT Journal Management

## Arquitetura de Diários no Foundry V11+
- Desde as versões recentes, os Diários possuem uma estrutura hierárquica dividida em duas entidades:
  1. **`JournalEntry`**: O "livro" ou diretório principal que engloba as páginas.
  2. **`JournalEntryPage`**: O documento embutido (embedded document) de um `JournalEntry` onde o conteúdo (texto, imagem, PDF) realmente reside.

## Boas Práticas e Regras
- **Leitura (`get_journal`)**: Certifique-se de listar as páginas (`pages`) contidas na Entrada de Diário para devolver ao usuário todo o conteúdo.
- **Criação / Atualização**: Ao adicionar dados a um diário, decida se a melhor abordagem é criar uma nova página embutida (`JournalEntryPage`) ou criar um novo `JournalEntry`. Prefira adicionar páginas a uma Entrada de Diário se houver contexto compartilhado.
- Textos utilizam o atributo `text.content` nas páginas de formato Markdown ou HTML (`type: "text"`).
