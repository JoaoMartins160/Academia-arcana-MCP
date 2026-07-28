import { describe, expect, it, vi } from "vitest";
import type { FoundryClient } from "../../../../foundry/client.js";
import {
  getDaggerheartRangeBand,
  handleGetDaggerheartCombatTacticalContext,
} from "../daggerheart_tactical_combat_context_handler.js";

describe("getDaggerheartRangeBand", () => {
  it("should map distance in feet to correct Daggerheart range band", () => {
    expect(getDaggerheartRangeBand(0)).toBe("Melee");
    expect(getDaggerheartRangeBand(5)).toBe("Melee");
    expect(getDaggerheartRangeBand(10)).toBe("Very Close");
    expect(getDaggerheartRangeBand(15)).toBe("Very Close");
    expect(getDaggerheartRangeBand(25)).toBe("Close");
    expect(getDaggerheartRangeBand(30)).toBe("Close");
    expect(getDaggerheartRangeBand(50)).toBe("Far");
    expect(getDaggerheartRangeBand(60)).toBe("Far");
    expect(getDaggerheartRangeBand(75)).toBe("Very Far");
  });
});

describe("handleGetDaggerheartCombatTacticalContext", () => {
  it("should return message if no active combat", async () => {
    const mockClient = {
      getCombatState: vi.fn().mockReturnValue(null),
    } as unknown as FoundryClient;

    const result = await handleGetDaggerheartCombatTacticalContext(
      {},
      mockClient,
    );
    expect(result.content[0].text).toContain("No active combat encounter");
  });

  it("should return combat context with range bands and ASCII map", async () => {
    const mockClient = {
      getCombatState: vi.fn().mockReturnValue({
        round: 2,
        turn: 0,
        combatants: [
          { name: "Hero PC", actorId: "act1", defeated: false },
          { name: "Forest Goblin", actorId: "act2", defeated: false },
        ],
      }),
      getRawActor: vi.fn().mockImplementation((id) => {
        if (id === "act1") {
          return {
            system: {
              resources: {
                hp: { value: 10, max: 12 },
                stress: { value: 1, max: 5 },
              },
              evasion: 12,
              armor: 2,
            },
          };
        }
        return null;
      }),
    } as unknown as FoundryClient;

    const result = await handleGetDaggerheartCombatTacticalContext(
      {},
      mockClient,
    );
    const text = result.content[0].text;
    expect(text).toContain("Daggerheart Tactical Combat Context");
    expect(text).toContain("Hero PC");
    expect(text).toContain("BATTLEFIELD TACTICAL ASCII MAP");
  });
});
