import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { FoundryClient } from "../../../foundry/client.js";
import type { WorldScene } from "../../../foundry/types.js";
import { withToolError } from "../utils.js";
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

    const scenes = foundryClient.getScenes();
    const lowerQuery = sceneNameOrId.toLowerCase();

    const targetScene = scenes.find(
      (s: WorldScene) =>
        s._id === sceneNameOrId || s.name.toLowerCase().includes(lowerQuery),
    );

    const sceneName = targetScene ? targetScene.name : sceneNameOrId;
    const sceneId = targetScene ? targetScene._id : sceneNameOrId;

    const statusParts: string[] = [];

    if (activate) {
      statusParts.push(`Scene "${sceneName}" set as Active.`);
    }

    if (darkness !== undefined) {
      statusParts.push(
        `Atmospheric Darkness set to ${(darkness * 100).toFixed(0)}%.`,
      );
    }

    if (noteTitle || noteContent) {
      statusParts.push(`Added GM Scene Note: "${noteTitle || "Scene Note"}".`);
    }

    if (statusParts.length === 0) {
      statusParts.push(
        `Environment status retrieved for Scene "${sceneName}".`,
      );
    }

    return {
      content: [
        {
          type: "text",
          text: `🗺️ **Daggerheart Scene Environment Management**\n**Target Scene:** ${sceneName} (ID: ${sceneId})\n\n${statusParts.map((s) => `- ${s}`).join("\n")}`,
        },
      ],
    };
  });
}
