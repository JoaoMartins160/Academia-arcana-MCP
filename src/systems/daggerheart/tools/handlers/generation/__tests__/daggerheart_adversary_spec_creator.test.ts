import { describe, expect, it, vi } from "vitest";
import type { FoundryClient } from "../../../../../../foundry/client.js";
import { handleCreateDaggerheartAdversarySpec } from "../daggerheart_adversary_spec_creator.js";

describe("handleCreateDaggerheartAdversarySpec", () => {
  it("should create a solo tier 3 adversary spec", async () => {
    const mockClient = {
      createActor: vi
        .fn()
        .mockResolvedValue({ _id: "adv123", name: "Dread Lord" }),
      getFolders: vi.fn().mockReturnValue([]),
    } as unknown as FoundryClient;

    const result = await handleCreateDaggerheartAdversarySpec(
      {
        name: "Dread Lord",
        tier: 3,
        adversaryType: "solo",
        hp: 12,
        stress: 6,
        evasion: 14,
        armor: 4,
        motives: ["Dominate the Realm"],
        experiences: ["Master Swordplay +3"],
        attackName: "Void Blade",
        attackRange: "Melee",
        damageFormula: "2d10+4",
      },
      mockClient,
    );

    expect(mockClient.createActor).toHaveBeenCalledWith(
      "Dread Lord",
      "adversary",
      expect.objectContaining({
        tier: 3,
        type: "solo",
        evasion: 14,
        armor: 4,
      }),
      undefined,
    );

    const text = result.content[0].text;
    expect(text).toContain("Dread Lord");
    expect(text).toContain("solo");
    expect(text).toContain("Void Blade");
  });

  it("should use default fallback values when non-required fields are omitted", async () => {
    const mockClient = {
      createActor: vi
        .fn()
        .mockResolvedValue({ _id: "adv456", name: "Custom Beast" }),
      getFolders: vi.fn().mockReturnValue([]),
    } as unknown as FoundryClient;

    const result = await handleCreateDaggerheartAdversarySpec(
      {
        name: "Custom Beast",
        tier: 2,
        adversaryType: "standard",
        hp: 8,
        evasion: 10,
      },
      mockClient,
    );

    const text = result.content[0].text;
    expect(text).toContain("Custom Beast");
    expect(text).toContain("standard");
  });
});
