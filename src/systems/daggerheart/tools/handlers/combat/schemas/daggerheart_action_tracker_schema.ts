import { z } from "zod";

export const DaggerheartActionTrackerSchema = z.object({
  actionDelta: z.number().int().optional().default(0),
  fearDelta: z.number().int().optional().default(0),
  reason: z.string().optional(),
});

export type DaggerheartActionTrackerPayload = z.infer<
  typeof DaggerheartActionTrackerSchema
>;

export function parseDaggerheartActionTrackerArgs(
  args: unknown,
): DaggerheartActionTrackerPayload {
  const parsed = DaggerheartActionTrackerSchema.safeParse(args || {});
  if (!parsed.success) {
    throw new Error(
      `Invalid Daggerheart Action Tracker payload: ${parsed.error.errors.map((e) => e.message).join(", ")}`,
    );
  }
  return parsed.data;
}
