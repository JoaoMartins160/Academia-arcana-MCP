import { z } from "zod";

export const DaggerheartSceneManagementSchema = z.object({
  sceneNameOrId: z.string().min(1, "sceneNameOrId is required"),
  activate: z.boolean().optional().default(false),
  darkness: z.number().min(0).max(1).optional(),
  noteTitle: z.string().optional(),
  noteContent: z.string().optional(),
});

export type DaggerheartSceneManagementPayload = z.infer<
  typeof DaggerheartSceneManagementSchema
>;

export function parseDaggerheartSceneManagementArgs(
  args: unknown,
): DaggerheartSceneManagementPayload {
  const parsed = DaggerheartSceneManagementSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(
      `Invalid Daggerheart Scene Management payload: ${parsed.error.errors.map((e) => e.message).join(", ")}`,
    );
  }
  return parsed.data;
}
