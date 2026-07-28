import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type {
  AttributePatch,
  FoundryClient,
} from "../../../../../foundry/client.js";
import { withToolError } from "../../../../../tools/handlers/utils.js";
import {
  type DaggerheartExperiencePayload,
  parseDaggerheartExperienceArgs,
} from "./schemas/daggerheart_experience_schema.js";

export async function handleInvokeDaggerheartExperience(
  args: unknown,
  foundryClient: FoundryClient,
) {
  return withToolError("invoke Daggerheart experience", async () => {
    let payload: DaggerheartExperiencePayload;
    try {
      payload = parseDaggerheartExperienceArgs(args);
    } catch (err) {
      throw new McpError(
        ErrorCode.InvalidParams,
        err instanceof Error ? err.message : "Invalid parameters",
      );
    }

    const { actorId, experienceName, modifier, spendHope } = payload;

    const actor = foundryClient.getRawActor(actorId);
    if (!actor) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Actor not found: ${actorId}`,
      );
    }

    const system = (actor.system as Record<string, unknown>) || {};
    const resources = (system.resources as Record<string, unknown>) || {};

    let hopeMsg = "";

    if (spendHope) {
      const currentHope = (resources.hope as { value?: number })?.value ?? 0;
      if (currentHope > 0) {
        const newHope = currentHope - 1;
        const changes: AttributePatch = {
          "system.resources.hope.value": newHope,
        };
        await foundryClient.updateActorAttribute(actorId, changes);
        hopeMsg = ` Spent 1 Hope (Remaining: ${newHope}/6).`;
      } else {
        hopeMsg = " (Warning: 0 Hope available, invoked experience anyway).";
      }
    }

    const text = `🌟 **Daggerheart Experience Invoked**
**Actor:** ${actor.name}
**Experience:** "${experienceName}" (+${modifier} to Roll)${hopeMsg}
-----------------------------
*Apply +${modifier} bonus to the next Duality Roll.*`;

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
