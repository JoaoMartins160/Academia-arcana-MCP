import { z } from "zod";

export const DaggerheartAbilitiesSchema = z.object({
  agility: z.number().int().default(0),
  strength: z.number().int().default(0),
  finesse: z.number().int().default(0),
  instinct: z.number().int().default(0),
  presence: z.number().int().default(0),
  knowledge: z.number().int().default(0),
});

export const DaggerheartCharacterSchema = z.object({
  name: z.string().min(1, "Character name is required"),
  ancestry: z.string().min(1, "Ancestry is required"),
  community: z.string().min(1, "Community is required"),
  className: z.string().min(1, "Class name is required"),
  subclassName: z.string().optional(),
  level: z.number().int().min(1).max(10).optional().default(1),
  abilities: DaggerheartAbilitiesSchema.optional().default({
    agility: 0,
    strength: 0,
    finesse: 0,
    instinct: 0,
    presence: 0,
    knowledge: 0,
  }),
  hp: z.number().int().min(1).optional().default(12),
  stress: z.number().int().min(0).optional().default(5),
  evasion: z.number().int().min(0).optional().default(10),
  armor: z.number().int().min(0).optional().default(2),
  folder: z.string().optional(),
});

export type DaggerheartCharacterPayload = z.infer<
  typeof DaggerheartCharacterSchema
>;

export function parseDaggerheartCharacterArgs(
  args: unknown,
): DaggerheartCharacterPayload {
  const parsed = DaggerheartCharacterSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(
      `Invalid Daggerheart Character payload: ${parsed.error.errors.map((e) => e.message).join(", ")}`,
    );
  }
  return parsed.data;
}
