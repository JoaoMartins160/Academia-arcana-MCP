import { z } from "zod";

export const DaggerheartDomains = [
  "Arcana",
  "Blade",
  "Bone",
  "Codex",
  "Grace",
  "Midnight",
  "Sage",
  "Splendor",
  "Valor",
] as const;

export const DaggerheartDomainCardSchema = z.object({
  actorId: z.string().min(1, "actorId is required"),
  name: z.string().min(1, "name is required"),
  domain: z.string(),
  level: z.number().int().min(1).max(10).optional().default(1),
  hopeCost: z.number().int().min(0).optional().default(0),
  recallCost: z.number().int().min(0).optional().default(0),
  description: z.string().optional().default(""),
  vaulted: z.boolean().optional().default(false),
});

export type DaggerheartDomainCardPayload = z.infer<
  typeof DaggerheartDomainCardSchema
>;

export function parseDaggerheartDomainCardArgs(
  args: unknown,
): DaggerheartDomainCardPayload {
  const parsed = DaggerheartDomainCardSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(
      `Invalid Daggerheart Domain Card payload: ${parsed.error.errors.map((e) => e.message).join(", ")}`,
    );
  }
  return parsed.data;
}
