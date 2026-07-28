import { describe, expect, it, vi } from "vitest";
import type { FoundryClient } from "../../../../foundry/client.js";
import { handleCreateDaggerheartAdversarySpec } from "../daggerheart_adversary_spec_creator.js";

describe("handleCreateDaggerheartAdversarySpec", () => {
  it("should create a Daggerheart adversary actor with payload mapping", async () => {
    const mockClient = {
      createActor: vi
        .fn()
        .mockResolvedValue({ _id: "adv777", name: "Dread Lord" }),
      getFolders: vi.fn().mockReturnValue([]),
    } as unknown as FoundryClient;

    const result = await handleCreateDaggerheartAdversarySpec(
      {
        name: "Dread Lord",
        tier: 3,
        adversaryType: "solo",
        hp: 15,
        stress: 5,
        evasion: 14,
        armor: 3,
        abilities: {
          agility: 1,
          strength: 3,
          finesse: 0,
          instinct: 2,
          presence: 4,
          knowledge: 2,
        },
        attackName: "Shadow Blade",
        attackRange: "Melee",
        damageFormula: "2d10+4 physical",
      },
      mockClient,
    );

    expect(mockClient.createActor).toHaveBeenCalledTimes(1);
    const [name, type, systemData] = (
      mockClient.createActor as ReturnType<typeof vi.fn>
    ).mock.calls[0];
    expect(name).toBe("Dread Lord");
    expect(type).toBe("adversary");
    expect(systemData.tier).toBe(3);
    expect(systemData.type).toBe("solo");
    expect(systemData.resources.hp.max).toBe(15);
    expect(systemData.evasion).toBe(14);
    expect(result.content[0].text).toContain("ID: adv777");
  });

  it("should return soft warnings for non-canonical ranges", async () => {
    const mockClient = {
      createActor: vi
        .fn()
        .mockResolvedValue({ _id: "adv888", name: "Custom Beast" }),
      getFolders: vi.fn().mockReturnValue([]),
    } as unknown as FoundryClient;

    const result = await handleCreateDaggerheartAdversarySpec(
      {
        name: "Custom Beast",
        tier: 2,
        adversaryType: "standard",
        hp: 8,
        evasion: 10,
        attackRange: "Ultra Distance",
      },
      mockClient,
    );

    expect(result.content[0].text).toContain("non-canonical");
  });
});
