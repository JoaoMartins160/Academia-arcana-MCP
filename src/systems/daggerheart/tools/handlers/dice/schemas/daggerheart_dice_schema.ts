import { z } from "zod";

export const DaggerheartDualityRollSchema = z.object({
  modifier: z.number().int().optional().default(0),
  advantage: z.boolean().optional().default(false),
  disadvantage: z.boolean().optional().default(false),
  reason: z.string().optional(),
});

export type DaggerheartDualityRollPayload = z.infer<
  typeof DaggerheartDualityRollSchema
>;

export function parseDaggerheartDualityRollArgs(
  args: unknown,
): DaggerheartDualityRollPayload {
  const parsed = DaggerheartDualityRollSchema.safeParse(args || {});
  if (!parsed.success) {
    throw new Error(
      `Invalid Daggerheart Duality Roll payload: ${parsed.error.errors.map((e) => e.message).join(", ")}`,
    );
  }
  return parsed.data;
}
