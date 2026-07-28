import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { FoundryClient } from "../../../../../foundry/client.js";
import {
  resolveFolderId,
  withToolError,
} from "../../../../../tools/handlers/utils.js";
import { logger } from "../../../../../utils/logger.js";
import {
  type DaggerheartAdversarySpecPayload,
  parseDaggerheartAdversarySpecArgs,
} from "./schemas/daggerheart_adversary_schema.js";

export type DaggerheartAdversarySpecArgs = DaggerheartAdversarySpecPayload;

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

    const folderId = resolveFolderId(foundryClient, data.folder, "Actor");

    const actorPayload = {
      name: data.name,
      type: "adversary",
      folder: folderId,
      system: {
        tier: data.tier,
        type: data.adversaryType,
        resources: {
          hp: { value: data.hp, max: data.hp },
          stress: { value: data.stress, max: data.stress },
        },
        evasion: data.evasion,
        armor: data.armor,
        abilities: data.abilities,
        motives: data.motives,
        experiences: data.experiences,
        attack: {
          name: data.attackName || "Primary Attack",
          range: data.attackRange || "Melee",
          damage: data.damageFormula || "1d8+2",
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

    return {
      content: [
        {
          type: "text",
          text: `👹 **Daggerheart Adversary Created**\n**Name:** ${data.name} (ID: ${createdActor._id})\n**Tier:** ${data.tier} | **Type:** ${data.adversaryType}\n**HP:** ${data.hp} | **Stress:** ${data.stress} | **Evasion:** ${data.evasion} | **Armor:** ${data.armor}\n**Attack:** ${data.attackName || "Primary Attack"} (${data.attackRange || "Melee"}) — ${data.damageFormula || "1d8+2"}\n**Motives:** ${data.motives.join(", ") || "None"}\n**Experiences:** ${data.experiences.join(", ") || "None"}`,
        },
      ],
    };
  });
}
