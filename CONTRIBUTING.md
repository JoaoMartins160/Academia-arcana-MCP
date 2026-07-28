# Guia de Contribuição — Academia-arcana-MCP

Obrigado pelo seu interesse em contribuir com o **Academia-arcana-MCP**! Este documento orienta o fluxo de trabalho, padrões de código, branching e convenções de commit adotadas no projeto.

---

## 🌲 Fluxo de Trabalho (Gitflow Real)

Seguimos estritamente o modelo de **Gitflow**:

1. **Branches Infinitas**:
   - `development`: Base ativa de desenvolvimento.
   - `main`: Código de produção estável.
2. **Branches Temporárias**:
   - **Features**: `feature/DES-<ID>-<nome-curto>` (nascem e morrem em `development`).
   - **Releases**: `release/v<MAJOR>.<MINOR>.<PATCH>` (nascem em `development`, mesclam em `main` e `development`).
   - **Hotfixes**: `hotfix/v<MAJOR>.<MINOR>.<PATCH>` (nascem em `main`, mesclam em `main` e `development`).

---

## 📝 Convenção de Commits (Conventional Commits)

Todas as mensagens de commit são validadas via Husky (`commit-msg` hook) e DEVEM seguir a estrutura:

```text
<tipo>(<escopo>): <descrição curta em minúsculas>
```

### Tipos Válidos
- `feat`: Nova funcionalidade.
- `fix`: Correção de bug.
- `docs`: Alteração em documentações.
- `style`: Formatação, ponto e vírgula, sem alteração de código produtivo.
- `refactor`: Refatoração sem alterar comportamento externo.
- `perf`: Melhoria de performance.
- `test`: Adição ou correção de testes.
- `chore`: Tarefas de build, dependências ou ferramentas de CI.

### Escopos Válidos
- **Backend / MCP**: `api`, `db`, `models`, `handlers`, `middleware`, `config`, `tools`, `utils`, `foundry`, `character`, `combat`.

### Exemplo Válido
```bash
git commit -m "feat(handlers): adiciona handler de combates para o Daggerheart"
```

---

## 🧪 Qualidade de Código & Testes

Antes de enviar sua Pull Request, garanta que todos os testes e linters passam:

1. **Formatador & Linter (Biome)**:
   ```bash
   npx biome check src/
   ```
2. **Checagem de Tipagem TypeScript**:
   ```bash
   npx tsc --noEmit
   ```
3. **Testes Unitários (Vitest)**:
   ```bash
   npm test
   ```

---

## 🚀 Como Criar uma Contribuição

1. Faça o fork / clone do repositório.
2. Atualize sua branch `development`:
   ```bash
   git checkout development
   git pull origin development
   ```
3. Crie sua branch de feature:
   ```bash
   git checkout -b feature/DES-123-minha-funcionalidade
   ```
4. Faça alterações, teste e faça commits pequenos e convencionais.
5. Mantenha seu histórico limpo executando rebase com a `development`:
   ```bash
   git fetch origin
   git rebase origin/development --autostash
   ```
6. Abra um Pull Request direcionado à branch `development`.
