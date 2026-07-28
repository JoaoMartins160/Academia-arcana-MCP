import { describe, expect, it, vi } from "vitest";
import type { FoundryClient } from "../../../../../../foundry/client.js";
import { handleManageDaggerheartSceneEnvironment } from "../daggerheart_scene_management_handler.js";

describe("handleManageDaggerheartSceneEnvironment", () => {
  it("should activate scene and update environment darkness", async () => {
    const mockClient = {
      getScenes: vi
        .fn()
        .mockResolvedValue([{ _id: "sc101", name: "Forest Clearing" }]),
      activateScene: vi.fn().mockResolvedValue({ success: true }),
    } as unknown as FoundryClient;

    const result = await handleManageDaggerheartSceneEnvironment(
      {
        sceneNameOrId: "Forest Clearing",
        activate: true,
        darkness: 0.7,
        noteTitle: "Ambush Spot",
        noteContent: "Goblins hiding behind trees.",
      },
      mockClient,
    );

    expect(mockClient.activateScene).toHaveBeenCalledWith("sc101");

    const text = result.content[0].text;
    expect(text).toContain("Forest Clearing");
    expect(text).toContain("Activated scene");
    expect(text).toContain("Atmospheric Darkness set to 70%");
  });
});
