import { z } from "zod";

export const DaggerheartResourceMutationSchema = z.object({
  actorId: z.string().min(1, "actorId is required"),
  hopeDelta: z.number().int().optional().default(0),
  stressDelta: z.number().int().optional().default(0),
});

export type DaggerheartResourceMutationPayload = z.infer<
  typeof DaggerheartResourceMutationSchema
>;

export function parseDaggerheartResourceMutationArgs(
  args: unknown,
): DaggerheartResourceMutationPayload {
  const parsed = DaggerheartResourceMutationSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(
      `Invalid Daggerheart Resource Mutation payload: ${parsed.error.errors.map((e) => e.message).join(", ")}`,
    );
  }
  return parsed.data;
}
