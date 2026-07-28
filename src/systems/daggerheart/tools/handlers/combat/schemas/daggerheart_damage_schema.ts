import { z } from "zod";

export const DaggerheartDamageThresholdSchema = z.object({
  actorId: z.string().min(1, "actorId is required"),
  damageTotal: z.number().min(0, "damageTotal must be >= 0"),
  damageType: z.enum(["physical", "magic"]).optional().default("physical"),
  useArmorSlot: z.boolean().optional().default(false),
  armorSlotCost: z.number().int().min(1).optional().default(1),
});

export type DaggerheartDamageThresholdPayload = z.infer<
  typeof DaggerheartDamageThresholdSchema
>;

export function parseDaggerheartDamageThresholdArgs(
  args: unknown,
): DaggerheartDamageThresholdPayload {
  const parsed = DaggerheartDamageThresholdSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(
      `Invalid Daggerheart Damage Threshold payload: ${parsed.error.errors.map((e) => e.message).join(", ")}`,
    );
  }
  return parsed.data;
}
