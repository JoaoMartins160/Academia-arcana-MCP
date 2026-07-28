import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { FoundryClient } from "../../../../../foundry/client.js";
import { withToolError } from "../../../../../tools/handlers/utils.js";
import {
  type DaggerheartDomainCardPayload,
  parseDaggerheartDomainCardArgs,
} from "./schemas/daggerheart_domain_card_schema.js";

export async function handleManageDaggerheartDomainCards(
  args: unknown,
  foundryClient: FoundryClient,
) {
  return withToolError("manage Daggerheart domain cards", async () => {
    let payload: DaggerheartDomainCardPayload;
    try {
      payload = parseDaggerheartDomainCardArgs(args);
    } catch (err) {
      throw new McpError(
        ErrorCode.InvalidParams,
        err instanceof Error ? err.message : "Invalid parameters",
      );
    }

    const {
      actorId,
      name,
      domain,
      level,
      hopeCost,
      recallCost,
      description,
      vaulted,
    } = payload;

    const actor = foundryClient.getRawActor(actorId);
    if (!actor) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Actor not found: ${actorId}`,
      );
    }

    const itemPayload = {
      name,
      type: "domainCard",
      system: {
        domain,
        level,
        hopeCost,
        recallCost,
        description,
        vaulted,
      },
    };

    const createdItem = await foundryClient.createActorItem(actorId, {
      type: "inline",
      item: itemPayload,
    });

    const statusStr = vaulted ? "VAULTED" : "EQUIPPED IN LOADOUT";

    const text = `🃏 **Daggerheart Domain Card Managed**
**Actor:** ${actor.name}
**Card:** "${name}" (Level ${level} ${domain})
**Status:** ${statusStr}
**Item ID:** ${createdItem._id}`;

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
