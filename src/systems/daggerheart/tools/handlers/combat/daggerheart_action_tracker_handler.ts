import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { FoundryClient } from "../../../../../foundry/client.js";
import { withToolError } from "../../../../../tools/handlers/utils.js";
import {
  type DaggerheartActionTrackerPayload,
  parseDaggerheartActionTrackerArgs,
} from "./schemas/daggerheart_action_tracker_schema.js";

let currentActionTokens = 0;
let currentFearTokens = 0;

export async function handleManageDaggerheartActionTracker(
  args: unknown,
  _foundryClient: FoundryClient,
) {
  return withToolError("manage Daggerheart action tracker", async () => {
    let payload: DaggerheartActionTrackerPayload;
    try {
      payload = parseDaggerheartActionTrackerArgs(args);
    } catch (err) {
      throw new McpError(
        ErrorCode.InvalidParams,
        err instanceof Error ? err.message : "Invalid parameters",
      );
    }

    const { actionDelta, fearDelta, reason } = payload;

    currentActionTokens = Math.max(0, currentActionTokens + actionDelta);
    currentFearTokens = Math.min(6, Math.max(0, currentFearTokens + fearDelta));

    const reasonMsg = reason ? ` for "${reason}"` : "";

    const text = `🎯 **Daggerheart Action Tracker & GM Fear Pool**${reasonMsg}

**Action Tokens (Player Actions):** ${currentActionTokens} ${actionDelta !== 0 ? `(${actionDelta >= 0 ? `+${actionDelta}` : actionDelta})` : ""}
**GM Fear Tokens:** ${currentFearTokens}/6 ${fearDelta !== 0 ? `(${fearDelta >= 0 ? `+${fearDelta}` : fearDelta})` : ""}
-----------------------------
*Note: GM spends Fear Tokens to trigger Adversary moves and reactions.*`;

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
