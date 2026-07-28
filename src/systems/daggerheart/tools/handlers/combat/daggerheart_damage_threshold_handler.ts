import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type {
  AttributePatch,
  FoundryClient,
} from "../../../../../foundry/client.js";
import { withToolError } from "../../../../../tools/handlers/utils.js";
import {
  type DaggerheartDamageThresholdPayload,
  parseDaggerheartDamageThresholdArgs,
} from "./schemas/daggerheart_damage_schema.js";

export async function handleApplyDaggerheartDamageWithThresholds(
  args: unknown,
  foundryClient: FoundryClient,
) {
  return withToolError("apply Daggerheart damage thresholds", async () => {
    let payload: DaggerheartDamageThresholdPayload;
    try {
      payload = parseDaggerheartDamageThresholdArgs(args);
    } catch (err) {
      throw new McpError(
        ErrorCode.InvalidParams,
        err instanceof Error ? err.message : "Invalid parameters",
      );
    }

    const { actorId, damageTotal, useArmorSlot, armorSlotCost } = payload;

    const actor = foundryClient.getRawActor(actorId);
    if (!actor) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Actor not found: ${actorId}`,
      );
    }

    const system = (actor.system as Record<string, unknown>) || {};
    const thresholds = (system.thresholds as {
      minor?: number;
      major?: number;
      severe?: number;
    }) || { minor: 5, major: 11, severe: 17 };

    const hpData = ((system.resources as Record<string, unknown>)?.hp as {
      value?: number;
      max?: number;
    }) || { value: 12, max: 12 };
    const currentHp = hpData.value ?? 12;
    const armorScore = (system.armor as number) ?? 2;

    let netDamage = damageTotal;
    let armorMsg = "";

    if (useArmorSlot) {
      const mitigation = armorScore * armorSlotCost;
      netDamage = Math.max(0, damageTotal - mitigation);
      armorMsg = ` (Armor Slot Used: -${mitigation} damage mitigation)`;
    }

    let hpLoss = 0;
    let category = "NO DAMAGE";

    if (netDamage >= (thresholds.severe ?? 17)) {
      hpLoss = 3;
      category = "SEVERE Threshold";
    } else if (netDamage >= (thresholds.major ?? 11)) {
      hpLoss = 2;
      category = "MAJOR Threshold";
    } else if (netDamage >= (thresholds.minor ?? 5)) {
      hpLoss = 1;
      category = "MINOR Threshold";
    }

    const newHp = Math.max(0, currentHp - hpLoss);

    const changes: AttributePatch = {
      "system.resources.hp.value": newHp,
    };

    await foundryClient.updateActorAttribute(actorId, changes);

    const text = `💥 **Daggerheart Damage Resolution**
**Target:** ${actor.name}
**Incoming Damage:** ${damageTotal} ${payload.damageType}${armorMsg}
**Net Damage Evaluated:** ${netDamage}
**Category Reached:** ${category}
**HP Loss:** -${hpLoss} HP (HP: ${currentHp} ➔ ${newHp})`;

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
