import { describe, expect, it, vi } from "vitest";
import type { FoundryClient } from "../../../../foundry/client.js";
import { handleCreateDaggerheartQuestJournal } from "../daggerheart_quest_journal_handler.js";

describe("handleCreateDaggerheartQuestJournal", () => {
  it("should create a formatted quest journal entry", async () => {
    const mockClient = {
      createJournal: vi
        .fn()
        .mockResolvedValue({ _id: "j123", name: "The Lost Artifact" }),
      getFolders: vi.fn().mockReturnValue([]),
    } as unknown as FoundryClient;

    const result = await handleCreateDaggerheartQuestJournal(
      {
        questTitle: "The Lost Artifact",
        questDescription: "Retrieve the ancient crystal from the sunken ruins.",
        questType: "main",
        difficulty: "hard",
        rewards: "3 Hope, 100 Gold",
        objectives: [
          "Find the ruins",
          "Defeat the guardian",
          "Extract crystal",
        ],
      },
      mockClient,
    );

    expect(mockClient.createJournal).toHaveBeenCalledTimes(1);
    const callArgs = (mockClient.createJournal as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(callArgs[0]).toBe("The Lost Artifact");
    expect(callArgs[1]).toContain("The Lost Artifact");
    expect(callArgs[1]).toContain("Find the ruins");
    expect(callArgs[1]).toContain("3 Hope, 100 Gold");
    expect(result.content[0].text).toContain("ID: j123");
  });

  it("should throw error if questTitle is missing", async () => {
    const mockClient = {} as unknown as FoundryClient;
    await expect(
      handleCreateDaggerheartQuestJournal(
        { questTitle: "", questDescription: "Desc" },
        mockClient,
      ),
    ).rejects.toThrow();
  });
});
