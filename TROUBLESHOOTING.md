# Guia de Resolução de Problemas (Troubleshooting) — Academia-arcana-MCP

Este guia auxilia no diagnóstico e na solução de problemas comuns ao utilizar o servidor **Academia-arcana-MCP** com o Foundry VTT.

---

## 🔍 Diagnóstico Rápido

Antes de investigar falhas complexas, execute a suíte de verificação local do projeto:

```bash
# 1. Verificar erros de lint e formatação de código
npx biome check src/

# 2. Testar compilação do TypeScript sem emitir arquivos
npx tsc --noEmit

# 3. Executar os testes unitários com o Vitest
npm test
```

---

## ❌ Problemas Comuns de Conexão e Autenticação

### 1. "ECONNREFUSED" ou "Connection Refused"
- **Causa**: O servidor Foundry VTT não está rodando na URL especificada ou a porta está bloqueada.
- **Solução**:
  1. Verifique se o Foundry VTT está aberto e com um **mundo ativo carregado**.
  2. Confirme o valor de `FOUNDRY_URL` no arquivo `.env` (ex: `http://localhost:30000`).
  3. Teste abrir a URL no navegador para confirmar que a página do jogo carrega.

### 2. "Write operations are disabled. Set FOUNDRY_WRITE_ENABLED=true"
- **Causa**: Uma ferramenta tentou criar ou modificar um documento (ator, item, diário, combate), mas as mutações estão desativadas por padrão.
- **Solução**:
  1. Abra o arquivo `.env`.
  2. Altere ou adicione `FOUNDRY_WRITE_ENABLED=true`.
  3. Reinicie o servidor MCP.

### 3. "Authentication failed" ou "User not found"
- **Causa**: O usuário e/ou senha informados no `.env` não correspondem a um usuário existente no mundo ativo do Foundry VTT.
- **Solução**:
  1. Certifique-se de que o nome de usuário em `FOUNDRY_USERNAME` é idêntico (case-sensitive) ao cadastrado no Foundry VTT.
  2. Verifique se a senha em `FOUNDRY_PASSWORD` está correta.
  3. Confirme se o mundo está ativo (a autenticação não funciona na tela de setup do Foundry).

---

## 🎲 Problemas Específicos do Sistema Daggerheart

### 1. "Failed to calculate damage thresholds"
- **Causa**: O ator consultado não possui a estrutura de atributos ou limiares de dano do Daggerheart.
- **Solução**:
  - Garanta que o ator selecionado foi criado no sistema Daggerheart e possui os campos `thresholds` (Minor, Major, Severe) configurados na ficha.
  - Utilize a ferramenta `daggerheart_create_character` ou `daggerheart_create_adversary_spec` para gerar fichas com o esquema compatível.

### 2. "Action Tracker state not found"
- **Causa**: O combate ativo não possui rastreador de ações inicializado ou o ID do combate foi omitido.
- **Solução**:
  - Utilize `daggerheart_manage_action_tracker` com a ação `get` ou `add_token` para inicializar a contagem de tokens de ação no combate atual.

---

## 🛠️ Habilitando Logs Detalhados (Debug)

Se o erro persistir, ative o log detalhado para visualizar todo o fluxo do Socket.IO:

1. No `.env`, altere o nível de log:
   ```env
   LOG_LEVEL=debug
   ```
2. Inicie o servidor via `npm run dev`.
3. Inspecione as mensagens no console para verificar a sequência de conexão, autenticação `joinGame` e recepção dos dados do mundo (`worldData`).
