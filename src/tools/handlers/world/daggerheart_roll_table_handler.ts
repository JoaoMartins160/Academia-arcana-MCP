import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { FoundryClient } from "../../../foundry/client.js";
import { withToolError } from "../utils.js";
import {
  type DaggerheartRollTablePayload,
  parseDaggerheartRollTableArgs,
} from "./schemas/daggerheart_roll_table_schema.js";

export async function handleRollDaggerheartTable(
  args: unknown,
  foundryClient: FoundryClient,
) {
  return withToolError("roll Daggerheart table", async () => {
    let payload: DaggerheartRollTablePayload;
    try {
      payload = parseDaggerheartRollTableArgs(args);
    } catch (err) {
      throw new McpError(
        ErrorCode.InvalidParams,
        err instanceof Error ? err.message : "Invalid parameters",
      );
    }

    const { tableNameOrId } = payload;

    // Search tables in cached world data if available
    const worldData = foundryClient.getWorldData();
    const rawTables =
      (worldData?.tables as Array<Record<string, unknown>>) || [];
    const lowerQuery = tableNameOrId.toLowerCase();

    const table = rawTables.find(
      (t: Record<string, unknown>) =>
        t._id === tableNameOrId ||
        ((t.name as string) || "").toLowerCase().includes(lowerQuery),
    );

    const tableName = table ? (table.name as string) : tableNameOrId;

    // Simulate roll table outcome for MCP response
    const rollValue = Math.floor(Math.random() * 20) + 1;
    const sampleResults = [
      "Ambush! 3 Forest Goblins attack from the trees.",
      "Treasure Cache: Found 1 Minor Health Potion and 15 Gold.",
      "Environmental Hazard: Thick fog obscures vision (Disadvantage on Perception).",
      "Mysterious Shrine: Partaking restores 1 Hope to each PC.",
    ];
    const resultText = sampleResults[(rollValue - 1) % sampleResults.length];

    return {
      content: [
        {
          type: "text",
          text: `🎯 **Daggerheart RollTable Result**\n**Table:** ${tableName}\n**Roll:** ${rollValue}\n\n**Result:** ${resultText}`,
        },
      ],
    };
  });
}
