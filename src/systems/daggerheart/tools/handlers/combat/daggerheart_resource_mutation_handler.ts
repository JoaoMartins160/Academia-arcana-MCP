import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type {
  AttributePatch,
  FoundryClient,
} from "../../../../../foundry/client.js";
import { withToolError } from "../../../../../tools/handlers/utils.js";
import {
  type DaggerheartResourceMutationPayload,
  parseDaggerheartResourceMutationArgs,
} from "./schemas/daggerheart_combat_schema.js";

export async function handleModifyDaggerheartCombatResources(
  args: unknown,
  foundryClient: FoundryClient,
) {
  return withToolError("modify Daggerheart combat resources", async () => {
    let payload: DaggerheartResourceMutationPayload;
    try {
      payload = parseDaggerheartResourceMutationArgs(args);
    } catch (err) {
      throw new McpError(
        ErrorCode.InvalidParams,
        err instanceof Error ? err.message : "Invalid parameters",
      );
    }

    const { actorId, hopeDelta, stressDelta } = payload;

    const actor = foundryClient.getRawActor(actorId);
    if (!actor) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Actor not found: ${actorId}`,
      );
    }

    const system = (actor.system as Record<string, unknown>) || {};
    const resources = (system.resources as Record<string, unknown>) || {};
    const hope = (resources.hope as { value?: number; max?: number }) || {
      value: 0,
      max: 6,
    };
    const stress = (resources.stress as { value?: number; max?: number }) || {
      value: 0,
      max: 5,
    };

    const newHope = Math.min(
      hope.max ?? 6,
      Math.max(0, (hope.value ?? 0) + hopeDelta),
    );
    const newStress = Math.min(
      stress.max ?? 5,
      Math.max(0, (stress.value ?? 0) + stressDelta),
    );

    const changes: AttributePatch = {};
    if (hopeDelta !== 0) {
      changes["system.resources.hope.value"] = newHope;
    }
    if (stressDelta !== 0) {
      changes["system.resources.stress.value"] = newStress;
    }

    if (Object.keys(changes).length > 0) {
      await foundryClient.updateActorAttribute(actorId, changes);
    }

    const text = `🔄 **Daggerheart Resources Updated**
**Actor:** ${actor.name}
**Hope:** ${hope.value ?? 0} ➔ ${newHope}/${hope.max ?? 6} (${hopeDelta >= 0 ? `+${hopeDelta}` : hopeDelta})
**Stress:** ${stress.value ?? 0} ➔ ${newStress}/${stress.max ?? 5} (${stressDelta >= 0 ? `+${stressDelta}` : stressDelta})`;

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
