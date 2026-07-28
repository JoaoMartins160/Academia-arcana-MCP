import { describe, expect, it } from "vitest";
import type { FoundryClient } from "../../../../../../foundry/client.js";
import { handleManageDaggerheartActionTracker } from "../daggerheart_action_tracker_handler.js";

describe("handleManageDaggerheartActionTracker", () => {
  it("should update player action tokens and GM fear pool", async () => {
    const mockClient = {} as unknown as FoundryClient;

    const result = await handleManageDaggerheartActionTracker(
      {
        actionDelta: 2,
        fearDelta: 1,
        reason: "Player Critical Action",
      },
      mockClient,
    );

    const text = result.content[0].text;
    expect(text).toContain("Daggerheart Action Tracker & GM Fear Pool");
    expect(text).toContain("Player Critical Action");
    expect(text).toContain("Action Tokens");
    expect(text).toContain("GM Fear Tokens");
  });
});
