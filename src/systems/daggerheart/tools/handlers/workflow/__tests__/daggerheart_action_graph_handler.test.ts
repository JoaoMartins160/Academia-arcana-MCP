import { describe, expect, it, vi } from "vitest";
import type { FoundryClient } from "../../../../../../foundry/client.js";
import { handleExecuteDaggerheartActionGraph } from "../daggerheart_action_graph_handler.js";

describe("handleExecuteDaggerheartActionGraph", () => {
  it("should execute nodes in sequence and resolve template variables", async () => {
    const mockClient = {} as unknown as FoundryClient;

    const graphPayload = {
      graphName: "Test Duality Roll & Tracker Workflow",
      stopOnError: true,
      nodes: [
        {
          id: "roll_duality",
          toolName: "daggerheart_roll_duality_extended",
          args: {
            modifier: 2,
            advantage: true,
            reason: "Workflow Roll Test",
          },
        },
        {
          id: "track_action",
          toolName: "daggerheart_manage_action_tracker",
          args: {
            actionDelta: 1,
            fearDelta: 0,
            reason: "Action spent after roll",
          },
        },
      ],
    };

    const result = await handleExecuteDaggerheartActionGraph(
      graphPayload,
      mockClient,
    );

    const text = result.content[0].text;
    expect(text).toContain("Daggerheart Action Graph Execution");
    expect(text).toContain("Test Duality Roll & Tracker Workflow");
    expect(text).toContain("roll_duality");
    expect(text).toContain("track_action");
    expect(text).toContain("Success");
  });
});
