import { describe, expect, it, vi } from "vitest";
import type { FoundryClient } from "../../../../../../foundry/client.js";
import { handleRollDaggerheartTable } from "../daggerheart_roll_table_handler.js";

describe("handleRollDaggerheartTable", () => {
  it("should evaluate roll table result", async () => {
    const mockClient = {
      getWorldData: vi.fn().mockResolvedValue({
        tables: [
          {
            _id: "tbl1",
            name: "Loot Table",
            results: [{ text: "Healing Potion" }],
          },
        ],
      }),
    } as unknown as FoundryClient;

    const result = await handleRollDaggerheartTable(
      { tableNameOrId: "Loot Table" },
      mockClient,
    );

    const text = result.content[0].text;
    expect(text).toContain("Loot Table");
    expect(text).toContain("Healing Potion");
  });
});
