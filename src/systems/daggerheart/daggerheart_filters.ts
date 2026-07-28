import { z } from "zod";

export const DaggerheartAdversaryTypes = [
  "minion",
  "social",
  "standard",
  "leader",
  "solo",
  "horde",
] as const;

export type DaggerheartAdversaryType =
  (typeof DaggerheartAdversaryTypes)[number];

export const DaggerheartFiltersSchema = z.object({
  name: z.string().optional(),
  tier: z
    .union([
      z.number().min(0).max(4),
      z.object({
        min: z.number().min(0).max(4).optional(),
        max: z.number().min(0).max(4).optional(),
      }),
    ])
    .optional(),
  adversaryType: z.enum(DaggerheartAdversaryTypes).optional(),
  size: z.string().optional(),
  hasExperiences: z.boolean().optional(),
});

export type DaggerheartFilters = z.infer<typeof DaggerheartFiltersSchema>;

/**
 * Test if a Daggerheart creature matches the specified filters.
 */
export function matchesDaggerheartFilters(
  creature: { systemData: Record<string, unknown> },
  filters: DaggerheartFilters,
): boolean {
  const data = creature.systemData;

  if (filters.name && typeof creature.systemData.name === "string") {
    const nameMatch = (creature.systemData.name as string)
      .toLowerCase()
      .includes(filters.name.toLowerCase());
    if (!nameMatch) return false;
  }

  if (filters.tier !== undefined) {
    const tier = typeof data.tier === "number" ? data.tier : undefined;
    if (tier === undefined) return false;

    if (typeof filters.tier === "number") {
      if (tier !== filters.tier) return false;
    } else {
      const min = filters.tier.min ?? 0;
      const max = filters.tier.max ?? 4;
      if (tier < min || tier > max) return false;
    }
  }

  if (filters.adversaryType !== undefined) {
    const advType = (data.adversaryType || data.type) as string | undefined;
    if (
      !advType ||
      advType.toLowerCase() !== filters.adversaryType.toLowerCase()
    ) {
      return false;
    }
  }

  if (filters.size !== undefined) {
    const size = data.size as string | undefined;
    if (!size || size.toLowerCase() !== filters.size.toLowerCase()) {
      return false;
    }
  }

  if (filters.hasExperiences !== undefined) {
    const exp = Array.isArray(data.experiences) ? data.experiences : [];
    const hasExp = exp.length > 0;
    if (hasExp !== filters.hasExperiences) return false;
  }

  return true;
}

/**
 * Generate human-readable filter description for Daggerheart.
 */
export function describeDaggerheartFilters(
  filters: DaggerheartFilters,
): string {
  const parts: string[] = [];

  if (filters.name) parts.push(`Name containing "${filters.name}"`);

  if (filters.tier !== undefined) {
    if (typeof filters.tier === "number") {
      parts.push(`Tier ${filters.tier}`);
    } else {
      parts.push(`Tier ${filters.tier.min ?? 0}-${filters.tier.max ?? 4}`);
    }
  }

  if (filters.adversaryType) parts.push(`Type: ${filters.adversaryType}`);
  if (filters.size) parts.push(`Size: ${filters.size}`);
  if (filters.hasExperiences !== undefined) {
    parts.push(
      filters.hasExperiences ? "With Experiences" : "Without Experiences",
    );
  }

  return parts.length > 0 ? parts.join(", ") : "no filters";
}
