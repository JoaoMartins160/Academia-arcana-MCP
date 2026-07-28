import { z } from "zod";

export const DaggerheartCompendiumSearchSchema = z.object({
  query: z.string().optional().default(""),
  itemType: z
    .enum([
      "domainCard",
      "ancestry",
      "community",
      "class",
      "subclass",
      "weapon",
      "armor",
      "feature",
    ])
    .optional(),
  domain: z.string().optional(),
  level: z.number().int().min(1).max(10).optional(),
  attackRange: z.string().optional(),
});

export type DaggerheartCompendiumSearchPayload = z.infer<
  typeof DaggerheartCompendiumSearchSchema
>;

export function parseDaggerheartCompendiumSearchArgs(
  args: unknown,
): DaggerheartCompendiumSearchPayload {
  const parsed = DaggerheartCompendiumSearchSchema.safeParse(args || {});
  if (!parsed.success) {
    throw new Error(
      `Invalid Daggerheart Compendium Search payload: ${parsed.error.errors.map((e) => e.message).join(", ")}`,
    );
  }
  return parsed.data;
}
