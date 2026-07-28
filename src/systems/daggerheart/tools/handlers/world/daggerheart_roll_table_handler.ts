import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { FoundryClient } from "../../../../../foundry/client.js";
import { withToolError } from "../../../../../tools/handlers/utils.js";
import {
  type DaggerheartRollTablePayload,
  parseDaggerheartRollTableArgs,
} from "./schemas/daggerheart_roll_table_schema.js";

export async function handleRollDaggerheartTable(
  args: unknown,
  foundryClient: FoundryClient,
) {
  return withToolError("roll Daggerheart roll table", async () => {
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

    const worldData = await foundryClient.getWorldData();
    const tables =
      (worldData as { tables?: Array<Record<string, unknown>> })?.tables || [];

    const table = tables.find(
      (t) => t._id === tableNameOrId || t.name === tableNameOrId,
    );

    if (!table) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `RollTable not found: ${tableNameOrId}`,
      );
    }

    const results = (table.results as Array<Record<string, unknown>>) || [];
    const drawnResult =
      results.length > 0
        ? (results[Math.floor(Math.random() * results.length)]
            ?.text as string) || "Custom Outcome"
        : "Standard Roll Result";

    const text = `🎲 **Daggerheart RollTable Evaluated**
**Table:** ${table.name} (ID: ${table._id})
-----------------------------
**Drawn Result:** ${drawnResult}`;

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
