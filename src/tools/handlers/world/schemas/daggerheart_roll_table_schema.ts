import { z } from "zod";

export const DaggerheartRollTableSchema = z.object({
  tableNameOrId: z.string().min(1, "tableNameOrId is required"),
});

export type DaggerheartRollTablePayload = z.infer<
  typeof DaggerheartRollTableSchema
>;

export function parseDaggerheartRollTableArgs(
  args: unknown,
): DaggerheartRollTablePayload {
  const parsed = DaggerheartRollTableSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(
      `Invalid Daggerheart Roll Table payload: ${parsed.error.errors.map((e) => e.message).join(", ")}`,
    );
  }
  return parsed.data;
}
