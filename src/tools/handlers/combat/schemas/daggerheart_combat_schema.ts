import { z } from "zod";

export const DaggerheartCombatContextSchema = z.object({
  combatId: z.string().optional(),
  tokenId: z.string().optional(),
  zoomRadius: z.number().int().min(5).max(50).optional().default(15),
});

export type DaggerheartCombatContextPayload = z.infer<
  typeof DaggerheartCombatContextSchema
>;

export const DaggerheartResourceMutationSchema = z.object({
  actorId: z.string().min(1, "actorId is required"),
  hpDelta: z.number().int().optional().default(0),
  stressDelta: z.number().int().optional().default(0),
  hopeDelta: z.number().int().optional().default(0),
  fearDelta: z.number().int().optional().default(0),
  armorDelta: z.number().int().optional().default(0),
  statusEffect: z.string().optional(),
});

export type DaggerheartResourceMutationPayload = z.infer<
  typeof DaggerheartResourceMutationSchema
>;

export function parseDaggerheartCombatContextArgs(
  args: unknown,
): DaggerheartCombatContextPayload {
  const parsed = DaggerheartCombatContextSchema.safeParse(args || {});
  if (!parsed.success) {
    throw new Error(
      `Invalid Combat Tactical Context payload: ${parsed.error.errors.map((e) => e.message).join(", ")}`,
    );
  }
  return parsed.data;
}

export function parseDaggerheartResourceMutationArgs(
  args: unknown,
): DaggerheartResourceMutationPayload {
  const parsed = DaggerheartResourceMutationSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(
      `Invalid Combat Resource Mutation payload: ${parsed.error.errors.map((e) => e.message).join(", ")}`,
    );
  }
  return parsed.data;
}
