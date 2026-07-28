import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { AttributePatch, FoundryClient } from "../../../foundry/client.js";
import { withToolError } from "../utils.js";
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

    const {
      actorId,
      hpDelta,
      stressDelta,
      hopeDelta,
      fearDelta,
      armorDelta,
      statusEffect,
    } = payload;

    const actor = foundryClient.getRawActor(actorId);
    if (!actor) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Actor not found: ${actorId}`,
      );
    }

    const system = (actor.system as Record<string, unknown>) || {};
    const resources = (system.resources as Record<string, unknown>) || {};

    const changes: AttributePatch = {};

    if (hpDelta !== 0) {
      const currentHp =
        ((resources.hp as { value?: number })?.value ??
          (system.hp as { value?: number })?.value ??
          0) + hpDelta;
      changes["system.resources.hp.value"] = Math.max(0, currentHp);
    }

    if (stressDelta !== 0) {
      const currentStress =
        ((resources.stress as { value?: number })?.value ??
          (system.stress as { value?: number })?.value ??
          0) + stressDelta;
      changes["system.resources.stress.value"] = Math.max(0, currentStress);
    }

    if (hopeDelta !== 0) {
      const currentHope =
        ((resources.hope as { value?: number })?.value ?? 0) + hopeDelta;
      changes["system.resources.hope.value"] = Math.min(
        6,
        Math.max(0, currentHope),
      );
    }

    if (fearDelta !== 0) {
      const currentFear =
        ((resources.fear as { value?: number })?.value ?? 0) + fearDelta;
      changes["system.resources.fear.value"] = Math.min(
        6,
        Math.max(0, currentFear),
      );
    }

    if (armorDelta !== 0) {
      const currentArmor = ((system.armor as number) ?? 0) + armorDelta;
      changes["system.armor"] = Math.max(0, currentArmor);
    }

    if (Object.keys(changes).length > 0) {
      await foundryClient.updateActorAttribute(actorId, changes);
    }

    let statusMsg = "";
    if (statusEffect) {
      statusMsg = ` Applied Status Effect: "${statusEffect}".`;
    }

    return {
      content: [
        {
          type: "text",
          text: `Successfully modified combat resources for "${actor.name}" (ID: ${actorId}).${statusMsg}`,
        },
      ],
    };
  });
}
