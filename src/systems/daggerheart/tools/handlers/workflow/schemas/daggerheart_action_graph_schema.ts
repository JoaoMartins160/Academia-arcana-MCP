import { z } from "zod";

export const GraphNodeSchema = z.object({
  id: z.string().min(1, "Node id is required"),
  toolName: z.string().min(1, "toolName is required"),
  args: z.record(z.unknown()).optional().default({}),
  dependsOn: z.array(z.string()).optional().default([]),
});

export type GraphNodePayload = z.infer<typeof GraphNodeSchema>;

export const DaggerheartActionGraphSchema = z.object({
  graphName: z.string().optional().default("Unnamed Workflow Graph"),
  stopOnError: z.boolean().optional().default(true),
  nodes: z.array(GraphNodeSchema).min(1, "Graph must contain at least 1 node"),
});

export type DaggerheartActionGraphPayload = z.infer<
  typeof DaggerheartActionGraphSchema
>;

export function parseDaggerheartActionGraphArgs(
  args: unknown,
): DaggerheartActionGraphPayload {
  const parsed = DaggerheartActionGraphSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(
      `Invalid Daggerheart Action Graph payload: ${parsed.error.errors.map((e) => e.message).join(", ")}`,
    );
  }
  return parsed.data;
}
