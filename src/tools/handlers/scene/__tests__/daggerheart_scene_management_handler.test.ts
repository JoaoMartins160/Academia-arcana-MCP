import { describe, expect, it, vi } from "vitest";
import type { FoundryClient } from "../../../../foundry/client.js";
import { handleManageDaggerheartSceneEnvironment } from "../daggerheart_scene_management_handler.js";

describe("handleManageDaggerheartSceneEnvironment", () => {
  it("should manage scene activation, darkness, and notes", async () => {
    const mockClient = {
      getScenes: vi
        .fn()
        .mockReturnValue([{ _id: "sc99", name: "Sunken Temple" }]),
    } as unknown as FoundryClient;

    const result = await handleManageDaggerheartSceneEnvironment(
      {
        sceneNameOrId: "Sunken Temple",
        activate: true,
        darkness: 0.7,
        noteTitle: "Trap Danger",
        noteContent: "Hidden dart trap at grid (10, 15)",
      },
      mockClient,
    );

    const text = result.content[0].text;
    expect(text).toContain("Daggerheart Scene Environment Management");
    expect(text).toContain("Sunken Temple");
    expect(text).toContain("Active");
    expect(text).toContain("Atmospheric Darkness set to 70%");
    expect(text).toContain("Trap Danger");
  });
});
