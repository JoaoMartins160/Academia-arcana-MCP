---
name: gitflow-workflow
description: Orienta as etapas de Gitflow Real no projeto, com regras de branching, rebase, merges estruturados e tags de versão.
---

# Description: Orienta as etapas de Gitflow Real no projeto, com regras de branching, rebase, merges estruturados e tags de versão.

## Regras de Ouro
1. **Ambientes como Destinos**: Lembre-se que Staging e Production são destinos de deploy disparados por triggers de branch ou tags, e não branches infinitas de desenvolvimento. As únicas branches infinitas são `development` (base ativa) e `main` (produção atual).
2. **Nomenclatura Estrita**:
   - Features: `feature/DES-<ID>-<nome-curto>` (nascem de `development`, morrem em `development`).
   - Releases: `release/v<MAJOR>.<MINOR>.<PATCH>` (nascem de `development`, morrem em `main` e `development`).
   - Hotfixes: `hotfix/v<MAJOR>.<MINOR>.<PATCH>` (nascem de `main`, morrem em `main` e `development`).
3. **Rebase Seguro**: Antes de abrir PR para a `development`, faça `git fetch origin` e `git rebase origin/development --autostash` para alinhar o histórico de forma linear e limpa.
4. **Commits Convencionais**: Use o padrão de commits do `git_flow.md` respeitando os escopos do Go (`api`, `db`, `models`, `handlers`, `middleware`, `config`) e React (`ui`, `hooks`, `queries`, `router`, `store`, `components`, `types`).
5. **Tagging Obrigatório**: Todo merge na `main` proveniente de uma release ou hotfix DEVE ser seguido da criação de uma tag de versão anotada (`git tag -a v1.2.0 -m "Release v1.2.0"`).
6. **Propagação de Hotfix**: Todo hotfix commitado na `main` deve ser mesclado/propagado imediatamente de volta para a `development`.

## Passos para Criar uma Feature
1. Atualize sua base local:
   ```bash
   git checkout development
   git pull origin development
   ```
2. Crie a branch temporária da feature associada ao Linear:
   ```bash
   git checkout -b feature/DES-<ID>-<nome-curto>
   ```
3. Trabalhe, faça commits atômicos convencionais e sincronize com a development fazendo rebase:
   ```bash
   git fetch origin
   git rebase origin/development --autostash
   ```
4. Abra a Pull Request para a `development`.

## Passos para Criar uma Release
1. A partir de `development`, crie a branch de release:
   ```bash
   git checkout -b release/vX.Y.0
   ```
2. Atualize o `package.json` no Frontend (se houver) e o `CHANGELOG.md` na raiz.
3. Comite as alterações de bump e finalização de Changelog:
   ```bash
   git commit -am "chore(release): bump version to X.Y.0 and update changelog"
   ```
4. Abra o PR para a `main` e outro para a `development`.
5. Após o merge na `main`, execute o tagging na `main`:
   ```bash
   git checkout main
   git pull origin main
   git tag -a vX.Y.0 -m "Release vX.Y.0"
   git push origin vX.Y.0
   ```

## Passos para Criar um Hotfix
1. A partir de `main`, crie a branch de hotfix:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/vX.Y.Z
   ```
2. Implemente o fix, teste, atualize a versão e o `CHANGELOG.md` e comite.
3. Abra PR para a `main`.
4. Após aprovado e mesclado, tagueie a versão:
   ```bash
   git checkout main
   git tag -a vX.Y.Z -m "Hotfix vX.Y.Z"
   git push origin vX.Y.Z
   ```
5. Propague a correção de volta para a `development`:
   ```bash
   git checkout development
   git pull origin development
   git merge --no-ff hotfix/vX.Y.Z
   git push origin development
   ```
