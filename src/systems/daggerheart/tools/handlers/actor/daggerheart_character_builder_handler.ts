import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { FoundryClient } from "../../../../../foundry/client.js";
import {
  resolveFolderId,
  withToolError,
} from "../../../../../tools/handlers/utils.js";
import { logger } from "../../../../../utils/logger.js";
import {
  type DaggerheartCharacterPayload,
  parseDaggerheartCharacterArgs,
} from "./schemas/daggerheart_character_schema.js";

export async function handleCreateDaggerheartCharacter(
  args: unknown,
  foundryClient: FoundryClient,
) {
  return withToolError("create Daggerheart character", async () => {
    let data: DaggerheartCharacterPayload;
    try {
      data = parseDaggerheartCharacterArgs(args);
    } catch (err) {
      throw new McpError(
        ErrorCode.InvalidParams,
        err instanceof Error ? err.message : "Invalid parameters",
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

    const minorThreshold = Math.max(3, Math.floor(data.hp * 0.35));
    const majorThreshold = Math.max(7, Math.floor(data.hp * 0.7));
    const severeThreshold = data.hp;

    const actorPayload = {
      name: data.name,
      type: "character",
      folder: folderId,
      system: {
        level: data.level,
        ancestry: data.ancestry,
        community: data.community,
        class: data.className,
        subclass: data.subclassName || "",
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
          stress: { value: 0, max: data.stress },
          hope: { value: 2, max: 6 },
        },
        thresholds: {
          minor: minorThreshold,
          major: majorThreshold,
          severe: severeThreshold,
        },
        evasion: data.evasion,
        armor: data.armor,
      },
    };

    logger.info(
      `[DaggerheartCharacter] Creating character '${data.name}' (${data.ancestry} ${data.className})...`,
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
          text: `🧙‍♂️ **Daggerheart Character Created**\n**Name:** ${data.name} (ID: ${createdActor._id})\n**Ancestry:** ${data.ancestry} | **Community:** ${data.community}\n**Class:** ${data.className}${data.subclassName ? ` (${data.subclassName})` : ""}\n**HP:** ${data.hp} | **Stress Capacity:** ${data.stress} | **Evasion:** ${data.evasion} | **Armor:** ${data.armor}\n**Damage Thresholds:** Minor ${minorThreshold} / Major ${majorThreshold} / Severe ${severeThreshold}`,
        },
      ],
    };
  });
}
