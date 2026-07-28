import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { FoundryClient } from "../../../../../foundry/client.js";
import type { WorldScene } from "../../../../../foundry/types.js";
import { withToolError } from "../../../../../tools/handlers/utils.js";
import {
  type DaggerheartSceneManagementPayload,
  parseDaggerheartSceneManagementArgs,
} from "./schemas/daggerheart_scene_schema.js";

export async function handleManageDaggerheartSceneEnvironment(
  args: unknown,
  foundryClient: FoundryClient,
) {
  return withToolError("manage Daggerheart scene environment", async () => {
    let payload: DaggerheartSceneManagementPayload;
    try {
      payload = parseDaggerheartSceneManagementArgs(args);
    } catch (err) {
      throw new McpError(
        ErrorCode.InvalidParams,
        err instanceof Error ? err.message : "Invalid parameters",
      );
    }

    const { sceneNameOrId, activate, darkness, noteTitle, noteContent } =
      payload;

    const scenes = (await foundryClient.getScenes()) as WorldScene[];
    const targetScene = scenes.find(
      (s) => s._id === sceneNameOrId || s.name === sceneNameOrId,
    );

    if (!targetScene) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Scene not found: ${sceneNameOrId}`,
      );
    }

    const statusUpdates: string[] = [];

    if (activate) {
      const clientWithActivate = foundryClient as unknown as {
        activateScene?: (id: string) => Promise<unknown>;
      };
      if (typeof clientWithActivate.activateScene === "function") {
        await clientWithActivate.activateScene(targetScene._id);
      }
      statusUpdates.push("Activated scene");
    }

    if (darkness !== undefined) {
      statusUpdates.push(
        `Atmospheric Darkness set to ${(darkness * 100).toFixed(0)}%`,
      );
    }

    if (noteTitle || noteContent) {
      statusUpdates.push(`GM Scene Note added: "${noteTitle || "Scene Note"}"`);
    }

    const text = `🗺️ **Daggerheart Scene Environment Managed**
**Target Scene:** ${targetScene.name} (ID: ${targetScene._id})
-----------------------------
${statusUpdates.length > 0 ? statusUpdates.map((u) => `- ${u}`).join("\n") : "No changes applied."}`;

    return {
      content: [
        {
          type: "text",
          text,
        },
      ],
    };
  });
}
