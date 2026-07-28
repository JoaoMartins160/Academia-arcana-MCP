import { describe, expect, it, vi } from "vitest";
import type { FoundryClient } from "../../../../../../foundry/client.js";
import {
  calculateDaggerheartRange,
  handleGetDaggerheartCombatTacticalContext,
  renderAsciiTacticalMap,
} from "../daggerheart_tactical_combat_context_handler.js";

describe("calculateDaggerheartRange", () => {
  it("should return correct Daggerheart range bands based on distance", () => {
    expect(calculateDaggerheartRange(3)).toBe("Melee");
    expect(calculateDaggerheartRange(10)).toBe("Very Close");
    expect(calculateDaggerheartRange(25)).toBe("Close");
    expect(calculateDaggerheartRange(50)).toBe("Far");
    expect(calculateDaggerheartRange(100)).toBe("Very Far");
  });
});

describe("renderAsciiTacticalMap", () => {
  it("should render ASCII grid and legend correctly", () => {
    const combatants = [
      {
        id: "c1",
        name: "Hero",
        x: 0,
        y: 0,
        hp: { value: 10, max: 10 },
        stress: { value: 0, max: 5 },
        rangeToTarget: "Melee",
      },
    ];

    const result = renderAsciiTacticalMap(combatants, 20);
    expect(result).toContain("```text");
    expect(result).toContain("[1] Hero (Melee)");
  });
});

describe("handleGetDaggerheartCombatTacticalContext", () => {
  it("should return formatted tactical context for active combat", async () => {
    const mockClient = {
      getCombatState: vi.fn().mockResolvedValue({
        round: 1,
        turn: 1,
        combatants: [
          {
            _id: "c1",
            name: "Goblin",
            token: { x: 5, y: 5 },
            actor: {
              name: "Goblin",
              system: {
                resources: {
                  hp: { value: 6, max: 6 },
                  stress: { value: 0, max: 3 },
                },
              },
            },
          },
        ],
      }),
    } as unknown as FoundryClient;

    const result = await handleGetDaggerheartCombatTacticalContext(
      {},
      mockClient,
    );

    const text = result.content[0].text;
    expect(text).toContain("Daggerheart Tactical Combat Context");
    expect(text).toContain("Goblin");
  });
});
