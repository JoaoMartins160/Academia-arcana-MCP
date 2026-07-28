import { describe, expect, it, vi } from "vitest";
import type { FoundryClient } from "../../../../foundry/client.js";
import { handleRollDaggerheartTable } from "../daggerheart_roll_table_handler.js";

describe("handleRollDaggerheartTable", () => {
  it("should roll on a RollTable and return result", async () => {
    const mockClient = {
      getWorldData: vi.fn().mockReturnValue({
        tables: [{ _id: "tbl1", name: "Random Encounters" }],
      }),
    } as unknown as FoundryClient;

    const result = await handleRollDaggerheartTable(
      { tableNameOrId: "Random Encounters" },
      mockClient,
    );

    const text = result.content[0].text;
    expect(text).toContain("Daggerheart RollTable Result");
    expect(text).toContain("Random Encounters");
    expect(text).toContain("Roll:");
  });
});
