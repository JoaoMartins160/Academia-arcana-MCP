import { z } from "zod";

export const DaggerheartExperienceSchema = z.object({
  actorId: z.string().min(1, "actorId is required"),
  experienceName: z.string().min(1, "experienceName is required"),
  modifier: z.number().int().optional().default(2),
  spendHope: z.boolean().optional().default(true),
});

export type DaggerheartExperiencePayload = z.infer<
  typeof DaggerheartExperienceSchema
>;

export function parseDaggerheartExperienceArgs(
  args: unknown,
): DaggerheartExperiencePayload {
  const parsed = DaggerheartExperienceSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(
      `Invalid Daggerheart Experience payload: ${parsed.error.errors.map((e) => e.message).join(", ")}`,
    );
  }
  return parsed.data;
}
