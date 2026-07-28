import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { withToolError } from "../../../../../tools/handlers/utils.js";
import {
  type DaggerheartDualityRollPayload,
  parseDaggerheartDualityRollArgs,
} from "./schemas/daggerheart_dice_schema.js";

export function rollD12(): number {
  return Math.floor(Math.random() * 12) + 1;
}

export function evaluateDualityRoll(
  hopeVal: number,
  fearVal: number,
  modifier = 0,
) {
  const isCritical = hopeVal === fearVal;
  const isHope = hopeVal > fearVal || isCritical;
  const total = hopeVal + fearVal + modifier;

  return {
    hopeVal,
    fearVal,
    modifier,
    total,
    isCritical,
    isHope,
    outcome: isCritical
      ? "CRITICAL SUCCESS! Gain 1 Hope & clear 1 Stress."
      : isHope
        ? "SUCCESS WITH HOPE! Gain 1 Hope Token."
        : "FAILURE WITH FEAR! GM gains 1 Fear Token.",
  };
}

export async function handleRollDaggerheartDualityExtended(args: unknown) {
  return withToolError("roll Daggerheart duality extended", async () => {
    let payload: DaggerheartDualityRollPayload;
    try {
      payload = parseDaggerheartDualityRollArgs(args);
    } catch (err) {
      throw new McpError(
        ErrorCode.InvalidParams,
        err instanceof Error ? err.message : "Invalid parameters",
      );
    }

    let hope = rollD12();
    const fear = rollD12();

    if (payload.advantage && !payload.disadvantage) {
      const advRoll = rollD12();
      hope = Math.max(hope, advRoll);
    } else if (payload.disadvantage && !payload.advantage) {
      const disRoll = rollD12();
      hope = Math.min(hope, disRoll);
    }

    const evalResult = evaluateDualityRoll(hope, fear, payload.modifier);

    const reasonMsg = payload.reason ? ` (${payload.reason})` : "";

    const text = `🎲 **Daggerheart Duality Roll**${reasonMsg}
**Hope Die (d12):** ${evalResult.hopeVal}
**Fear Die (d12):** ${evalResult.fearVal}
**Modifier:** ${evalResult.modifier >= 0 ? `+${evalResult.modifier}` : evalResult.modifier}
-----------------------------
**Total Score:** ${evalResult.total}
**Result:** ${evalResult.outcome}`;

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
