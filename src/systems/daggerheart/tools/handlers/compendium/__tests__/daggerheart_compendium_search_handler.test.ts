import { describe, expect, it, vi } from "vitest";
import type { FoundryClient } from "../../../../../../foundry/client.js";
import { handleSearchDaggerheartCompendium } from "../daggerheart_compendium_search_handler.js";

describe("handleSearchDaggerheartCompendium", () => {
  it("should search and filter compendium items by type and domain", async () => {
    const mockClient = {
      searchCompendium: vi.fn().mockResolvedValue({
        results: [
          {
            _id: "item1",
            name: "Fireball",
            type: "domainCard",
            system: { domain: "Arcana", level: 2 },
          },
          {
            _id: "item2",
            name: "Iron Shield",
            type: "armor",
            system: { domain: "Valor", level: 1 },
          },
        ],
      }),
    } as unknown as FoundryClient;

    const result = await handleSearchDaggerheartCompendium(
      {
        query: "Fire",
        itemType: "domainCard",
        domain: "Arcana",
      },
      mockClient,
    );

    const text = result.content[0].text;
    expect(text).toContain("Daggerheart Compendium Search");
    expect(text).toContain("Fireball");
    expect(text).not.toContain("Iron Shield");
  });
});
