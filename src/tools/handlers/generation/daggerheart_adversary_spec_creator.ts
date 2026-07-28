import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { FoundryClient } from "../../../foundry/client.js";
import { logger } from "../../../utils/logger.js";
import { resolveFolderId, withToolError } from "../utils.js";
import {
  type DaggerheartAdversarySpecPayload,
  DaggerheartAdversaryTypes,
  parseDaggerheartAdversarySpecArgs,
} from "./schemas/daggerheart_adversary_schema.js";

export { DaggerheartAdversaryTypes };
export type { DaggerheartAdversarySpecPayload as DaggerheartAdversarySpecArgs };

export async function handleCreateDaggerheartAdversarySpec(
  args: unknown,
  foundryClient: FoundryClient,
) {
  return withToolError("create Daggerheart adversary spec", async () => {
    let data: DaggerheartAdversarySpecPayload;
    try {
      data = parseDaggerheartAdversarySpecArgs(args);
    } catch (err) {
      throw new McpError(
        ErrorCode.InvalidParams,
        err instanceof Error ? err.message : "Invalid parameters",
      );
    }

    const warnings: string[] = [];

    // Soft warnings check
    if (data.tier > 4) {
      warnings.push(`Tier ${data.tier} exceeds maximum standard tier 4.`);
    }

    const canonicalRanges = ["Melee", "Very Close", "Close", "Far", "Very Far"];
    if (
      data.attackRange &&
      !canonicalRanges.some(
        (r) => r.toLowerCase() === data.attackRange?.toLowerCase(),
      )
    ) {
      warnings.push(
        `Attack range "${data.attackRange}" is non-canonical. Expected one of: ${canonicalRanges.join(", ")}.`,
      );
    }

    const folderId = resolveFolderId(foundryClient, data.folder, "Actor");

    const abilities = data.abilities || {
      agility: 0,
      strength: 0,
      finesse: 0,
      instinct: 0,
      presence: 0,
      knowledge: 0,
    };

    const actorPayload = {
      name: data.name,
      type: "adversary",
      folder: folderId,
      system: {
        tier: data.tier,
        type: data.adversaryType,
        attributes: {
          agility: { value: abilities.agility },
          strength: { value: abilities.strength },
          finesse: { value: abilities.finesse },
          instinct: { value: abilities.instinct },
          presence: { value: abilities.presence },
          knowledge: { value: abilities.knowledge },
        },
        resources: {
          hp: { value: data.hp, max: data.hp },
          stress: { value: data.stress, max: data.stress },
        },
        evasion: data.evasion,
        armor: data.armor,
        motives: data.motives,
        experiences: data.experiences,
        attack: {
          name: data.attackName || "Primary Attack",
          range: data.attackRange || "Melee",
          damage: data.damageFormula || "1d6 physical",
        },
      },
    };

    logger.info(
      `[DaggerheartAdversarySpec] Creating adversary '${data.name}' (Tier ${data.tier} ${data.adversaryType})...`,
    );

    const createdActor = await foundryClient.createActor(
      actorPayload.name,
      actorPayload.type,
      actorPayload.system,
      actorPayload.folder ?? undefined,
    );

    const warningText =
      warnings.length > 0
        ? `\n\n⚠️ **Warnings:**\n${warnings.map((w) => `- ${w}`).join("\n")}`
        : "";

    return {
      content: [
        {
          type: "text",
          text: `Successfully created Daggerheart Adversary "${data.name}" (ID: ${createdActor._id}, Tier: ${data.tier}, Type: ${data.adversaryType})${warningText}`,
        },
      ],
    };
  });
}
