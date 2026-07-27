---
name: foundry-zod-typing
description: Diretrizes rigorosas para modularização, criação de pastas de schemas, validação via Zod e erradicação de 'any' ou 'Record<string, unknown>' em novos handlers do Foundry MCP.
---

# Diretrizes e Padrões de Tipagem Zod no Foundry MCP

Sempre que for criar ou refatorar uma ferramenta (handler) do MCP para este projeto, você DEVE seguir rigidamente este padrão arquitetural e de validação. A intenção é impedir a propagação de dados mal formatados e falhas silenciosas na UI do FoundryVTT.

## 1. Modularização por Domínio
Qualquer agrupamento lógico de tools (ex: "actor", "combat", "item", "journal") deve ser isolado no seu próprio diretório.

**Estrutura de um Módulo:**
```text
src/tools/handlers/<dominio>/
├── <dominio>-handler.ts     # Ações de leitura / tools principais
├── <dominio>-mutations.ts   # Ações de escrita (create/update/delete)
└── schemas/
    └── <dominio>-schema.ts  # Definições de Zod para este domínio
```
Nomes de arquivos **devem ser descritivos** (ex: `actor-handler.ts`), nunca genéricos (`index.ts` ou `handler.ts`).

## 2. Erradicação de Tipos Fracos (`any` / `Record`)
**Nunca utilize:**
- `any`
- `Record<string, unknown>` (exceto quando Zod explicitamente exigir ou como fallback final num `catch`)

**Sempre utilize:**
- Interfaces para os parâmetros de funções.
- Inferência do Zod (`z.infer<typeof MeuSchema>`) para os tipos de dados validados que trafegam pelo sistema.
- Utility types (`Partial<T>`, `Pick<T, Keys>`) quando estiver atualizando (PATCH) um schema existente.

## 3. Construção de Zod Schemas (`<dominio>-schema.ts`)
Para todo tipo de dado originado do LLM (Payloads de criação/update) ou recebido do FoundryVTT:

1. **Campos Opcionais com Defaults:**
   Para dados de inserção, use intensamente `.optional().default()`. Isso protege o FoundryVTT contra atributos ausentes no JSON do LLM.
   ```typescript
   export const ActorStatsSchema = z.object({
     agility: z.number().int().optional().default(0),
     strength: z.number().int().optional().default(0),
   });
   ```

2. **Parsing com Fallbacks (Função Helper de Validação):**
   Exponha sempre uma função `parse<Dominio>Data(data: unknown): InferType` que roda `schema.safeParse()`.
   Se o parse falhar, a função deve retornar um erro claro para o cliente MCP.

   ```typescript
   export function parseActorCreationPayload(data: unknown): z.infer<typeof ActorSchema> {
     const parsed = ActorSchema.safeParse(data);
     if (!parsed.success) {
       throw new Error(`Invalid Actor Payload: ${parsed.error.message}`);
     }
     return parsed.data;
   }
   ```

## 4. Integração do Schema no Handler
Nos handlers (`<dominio>-handler.ts` e `<dominio>-mutations.ts`), aplique a validação **antes** de enviar a requisição para o Foundry.

```typescript
export async function handleCreateActor(args: { name: string, type: string, system: unknown }) {
    // 1. Validação estrita
    const parsedSystem = parseActorCreationPayload(args.system);
    // 2. Execução
    const result = await foundryClient.createActor(args.name, args.type, parsedSystem);
    // ...
}
```

## Resumo das Regras
- Crie uma pasta para a tool e uma subpasta `schemas/`.
- Nomes descritivos de arquivos: `<dominio>-handler.ts`.
- Sem tipagens soltas, use `z.infer` e defina um schema `Zod`.
- Intercepte os inputs com `safeParse`.
