import { describe, expect, it, vi } from "vitest";
import type { FoundryClient } from "../../../../../../foundry/client.js";
import { handleCreateDaggerheartQuestJournal } from "../daggerheart_quest_journal_handler.js";

describe("handleCreateDaggerheartQuestJournal", () => {
  it("should create a Daggerheart quest journal with objectives", async () => {
    const mockClient = {
      createJournal: vi
        .fn()
        .mockResolvedValue({ _id: "j123", name: "Quest: Goblin King" }),
      getFolders: vi.fn().mockReturnValue([]),
    } as unknown as FoundryClient;

    const result = await handleCreateDaggerheartQuestJournal(
      {
        questTitle: "Slay Goblin King",
        summary: "Infiltrate cave and defeat king.",
        questType: "main",
        difficulty: "hard",
        objectives: ["Find cave entrance", "Defeat King"],
        rewards: ["50 Gold", "Rare Relic"],
      },
      mockClient,
    );

    expect(mockClient.createJournal).toHaveBeenCalledWith(
      "Quest: Slay Goblin King",
      expect.any(String),
      undefined,
    );

    const text = result.content[0].text;
    expect(text).toContain("Slay Goblin King");
    expect(text).toContain("Find cave entrance");
  });

  it("should throw error if questTitle is missing", async () => {
    const mockClient = {} as unknown as FoundryClient;

    await expect(
      handleCreateDaggerheartQuestJournal({ summary: "No title" }, mockClient),
    ).rejects.toThrow();
  });
});
