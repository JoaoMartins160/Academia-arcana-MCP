import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { withToolError } from "../utils.js";
import {
  type DaggerheartDualityRollPayload,
  parseDaggerheartDualityRollArgs,
} from "./schemas/daggerheart_dice_schema.js";

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

    const { modifier, advantage, disadvantage, reason } = payload;

    const hopeDie = Math.floor(Math.random() * 12) + 1;
    const fearDie = Math.floor(Math.random() * 12) + 1;

    let advDie = 0;
    let advText = "";
    if (advantage && !disadvantage) {
      advDie = Math.floor(Math.random() * 6) + 1;
      advText = ` + Advantage d6 [${advDie}]`;
    } else if (disadvantage && !advantage) {
      advDie = -(Math.floor(Math.random() * 6) + 1);
      advText = ` - Disadvantage d6 [${Math.abs(advDie)}]`;
    }

    const total = hopeDie + fearDie + advDie + modifier;

    let outcome = "";
    if (hopeDie === fearDie) {
      outcome = "CRITICAL SUCCESS! 🎉 (Duality Match)";
    } else if (hopeDie > fearDie) {
      outcome = "Roll with HOPE 🌟";
    } else {
      outcome = "Roll with FEAR 💀";
    }

    const reasonText = reason ? ` for "${reason}"` : "";

    const text = `🎲 **Daggerheart Duality Roll**${reasonText}

**Hope Die (d12):** ${hopeDie}
**Fear Die (d12):** ${fearDie}
**Modifier:** ${modifier >= 0 ? `+${modifier}` : modifier}${advText}
-----------------------------
**Total Result:** **${total}**
**Outcome:** **${outcome}**`;

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
