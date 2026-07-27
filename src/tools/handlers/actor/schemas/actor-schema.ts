import { z } from "zod";

export const ActorTraitsSchema = z.object({
  agility: z.number().int().optional().default(0),
  strength: z.number().int().optional().default(0),
  finesse: z.number().int().optional().default(0),
  instinct: z.number().int().optional().default(0),
  presence: z.number().int().optional().default(0),
  knowledge: z.number().int().optional().default(0),
});

export const ActorResourceSchema = z.object({
  value: z.number().int().optional().default(0),
  max: z.number().int().optional().default(0),
});

export const CharacterSystemSchema = z
  .object({
    traits: ActorTraitsSchema.optional().default({
      agility: 0,
      strength: 0,
      finesse: 0,
      instinct: 0,
      presence: 0,
      knowledge: 0,
    }),
    evasion: z.number().int().optional().default(0),
    armor: z.number().int().optional().default(0),
    hope: ActorResourceSchema.optional().default({ value: 0, max: 0 }),
    stress: ActorResourceSchema.optional().default({ value: 0, max: 0 }),
    hitPoints: ActorResourceSchema.optional().default({ value: 0, max: 0 }),
  })
  .passthrough(); // Allow other unknown fields safely

export const AdversarySystemSchema = z
  .object({
    evasion: z.number().int().optional().default(0),
    hitPoints: ActorResourceSchema.optional().default({ value: 0, max: 0 }),
    tier: z.number().int().optional().default(1),
    difficulty: z.string().optional().default("standard"),
    fear: ActorResourceSchema.optional().default({ value: 0, max: 0 }),
    stress: ActorResourceSchema.optional().default({ value: 0, max: 0 }),
  })
  .passthrough();

export const ActorSchemas: Record<string, z.ZodTypeAny> = {
  character: CharacterSystemSchema,
  adversary: AdversarySystemSchema,
};

export function parseActorSystemData(
  type: string,
  data: Record<string, unknown> = {},
): Record<string, unknown> {
  const schema = ActorSchemas[type];
  if (!schema) {
    return data;
  }

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new Error(
      `Invalid system data for actor type '${type}'. ${parsed.error.message}`,
    );
  }
  return parsed.data as Record<string, unknown>;
}
