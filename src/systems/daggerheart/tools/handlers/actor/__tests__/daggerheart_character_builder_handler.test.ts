import { describe, expect, it, vi } from "vitest";
import type { FoundryClient } from "../../../../../../foundry/client.js";
import { handleCreateDaggerheartCharacter } from "../daggerheart_character_builder_handler.js";

describe("handleCreateDaggerheartCharacter", () => {
  it("should create a Daggerheart player character actor", async () => {
    const mockClient = {
      createActor: vi
        .fn()
        .mockResolvedValue({ _id: "pc999", name: "Lyra Frost" }),
      getFolders: vi.fn().mockReturnValue([]),
    } as unknown as FoundryClient;

    const result = await handleCreateDaggerheartCharacter(
      {
        name: "Lyra Frost",
        ancestry: "Elf",
        community: "Ridgeborne",
        className: "Wizard",
        subclassName: "School of Knowledge",
        abilities: {
          agility: 1,
          strength: 0,
          finesse: 2,
          instinct: 1,
          presence: 0,
          knowledge: 3,
        },
        hp: 12,
        stress: 5,
        evasion: 11,
        armor: 2,
      },
      mockClient,
    );

    expect(mockClient.createActor).toHaveBeenCalledWith(
      "Lyra Frost",
      "character",
      expect.objectContaining({
        ancestry: "Elf",
        community: "Ridgeborne",
        class: "Wizard",
        subclass: "School of Knowledge",
      }),
      undefined,
    );

    const text = result.content[0].text;
    expect(text).toContain("Lyra Frost");
    expect(text).toContain("Ridgeborne");
    expect(text).toContain("Wizard");
  });
});
