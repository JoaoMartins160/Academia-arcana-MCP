import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { FoundryClient } from "../../../foundry/client.js";
import { withToolError } from "../utils.js";
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

    const itemSystem = {
      domain,
      level,
      hopeCost,
      recallCost,
      description,
      vaulted,
    };

    const itemResult = await foundryClient.createActorItem(actorId, {
      type: "inline",
      item: {
        name,
        type: "domainCard",
        system: itemSystem,
      },
    });

    const vaultStatus = vaulted ? " [VAULTED]" : " [EQUIPPED]";

    return {
      content: [
        {
          type: "text",
          text: `Successfully added Domain Card "${name}" (${domain} Domain, Level ${level})${vaultStatus} to actor "${actor.name}" (ID: ${itemResult._id})`,
        },
      ],
    };
  });
}
