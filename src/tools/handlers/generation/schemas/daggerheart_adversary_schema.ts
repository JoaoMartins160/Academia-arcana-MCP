import { z } from "zod";

export const DaggerheartAdversaryTypes = [
  "minion",
  "social",
  "standard",
  "leader",
  "solo",
  "horde",
] as const;

export const DaggerheartAdversaryAbilitiesSchema = z.object({
  agility: z.number().default(0),
  strength: z.number().default(0),
  finesse: z.number().default(0),
  instinct: z.number().default(0),
  presence: z.number().default(0),
  knowledge: z.number().default(0),
});

export const DaggerheartAdversarySpecSchema = z.object({
  name: z.string().min(1, "Name is required"),
  tier: z.number().min(0).max(4),
  adversaryType: z.enum(DaggerheartAdversaryTypes),
  hp: z.number().min(1, "HP must be at least 1"),
  stress: z.number().min(0).default(3),
  evasion: z.number().min(0),
  armor: z.number().min(0).default(0),
  abilities: DaggerheartAdversaryAbilitiesSchema.optional().default({
    agility: 0,
    strength: 0,
    finesse: 0,
    instinct: 0,
    presence: 0,
    knowledge: 0,
  }),
  motives: z.array(z.string()).default([]),
  experiences: z.array(z.string()).default([]),
  attackName: z.string().optional(),
  attackRange: z.string().optional(),
  damageFormula: z.string().optional(),
  folder: z.string().optional(),
});

export type DaggerheartAdversarySpecPayload = z.infer<
  typeof DaggerheartAdversarySpecSchema
>;

export function parseDaggerheartAdversarySpecArgs(
  args: unknown,
): DaggerheartAdversarySpecPayload {
  const parsed = DaggerheartAdversarySpecSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(
      `Invalid Daggerheart Adversary Spec payload: ${parsed.error.errors.map((e) => e.message).join(", ")}`,
    );
  }
  return parsed.data;
}
