/**
 * @fileoverview Actor management tool handlers
 *
 * Handles searching for actors and retrieving detailed actor information.
 */

import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { FoundryClient } from "../../../foundry/client.js";
import { withToolError } from "../utils.js";

/**
 * Handles actor search requests
 */
export async function handleSearchActors(
  args: {
    query?: string;
    type?: string;
    limit?: number;
  },
  foundryClient: FoundryClient,
) {
  const { query, type, limit = 10 } = args;

  return withToolError("search actors", async () => {
    const searchParams: { query: string; type?: string; limit: number } = {
      query: query || "",
      limit,
    };
    if (type) {
      searchParams.type = type;
    }
    const result = await foundryClient.searchActors(searchParams);

    const actorList = result.actors
      .map(
        (actor) =>
          `- **${actor.name}** (ID: \`${actor._id}\`, ${actor.type}) - Level ${actor.level || "?"} - HP: ${actor.resources?.hitPoints?.value ?? "?"}/${actor.resources?.hitPoints?.max ?? "?"} - Evasion: ${actor.evasion ?? "?"}`,
      )
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `🎭 **Actor Search Results**
**Query:** ${query || "All actors"}
**Type Filter:** ${type || "All types"}
**Results:** ${result.actors.length}/${result.total} total

${actorList || "No actors found matching the criteria."}

**Page:** ${result.page} | **Limit:** ${result.limit}`,
        },
      ],
    };
  });
}

/**
 * Handles detailed actor information requests
 */
export async function handleGetActorDetails(
  args: {
    actorId: string;
  },
  foundryClient: FoundryClient,
) {
  const { actorId } = args;

  if (!actorId || typeof actorId !== "string") {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Actor ID is required and must be a string",
    );
  }

  return withToolError("get actor details", async () => {
    const actor = await foundryClient.getActor(actorId);

    const featuresStr =
      actor.features && actor.features.length > 0
        ? actor.features.map((f) => `- ${f}`).join("\n")
        : "No features available";

    const experiencesStr =
      actor.experiences && actor.experiences.length > 0
        ? actor.experiences.map((e) => `- ${e.name} (${e.value})`).join("\n")
        : "";

    let detailsMarkdown = `🎭 **Actor Details: ${actor.name}**\n**Type:** ${actor.type}\n`;

    if (actor.type === "adversary") {
      detailsMarkdown += `**Role:** ${actor.adversaryRole || "Unknown"}\n`;
      detailsMarkdown += `**Tier:** ${actor.tier || "Unknown"}\n`;
      detailsMarkdown += `**Difficulty:** ${actor.difficulty ?? "?"}\n\n`;

      const hpStr = `${actor.resources?.hitPoints?.value ?? "?"}/${actor.resources?.hitPoints?.max ?? "?"}`;
      const stressStr = `${actor.resources?.stress?.value ?? "?"}/${actor.resources?.stress?.max ?? "?"}`;
      detailsMarkdown += `**Hit Points:** ${hpStr}\n`;
      detailsMarkdown += `**Stress:** ${stressStr}\n`;

      const thresholdsStr = actor.thresholds
        ? `Major: ${actor.thresholds.major} | Severe: ${actor.thresholds.severe}`
        : "N/A";
      detailsMarkdown += `**Damage Thresholds:** ${thresholdsStr}\n\n`;

      if (actor.motivesAndTactics) {
        detailsMarkdown += `**Motives & Tactics:**\n${actor.motivesAndTactics}\n\n`;
      }

      if (experiencesStr) {
        detailsMarkdown += `**Experiences:**\n${experiencesStr}\n\n`;
      }

      detailsMarkdown += `**Features:**\n${featuresStr}\n\n`;

      if (actor.attacks && actor.attacks.length > 0) {
        detailsMarkdown += "**Attacks:**\n";
        for (const atk of actor.attacks) {
          detailsMarkdown += `- **${atk.name}** (${atk.modifier}) - ${atk.range} | Damage: ${atk.damage}\n`;
        }
      } else {
        detailsMarkdown += "**Attacks:** None\n";
      }
    } else if (actor.type === "companion") {
      detailsMarkdown += `**Evasion:** ${actor.evasion ?? "?"}\n`;
      const stressStr = `${actor.resources?.stress?.value ?? "?"}/${actor.resources?.stress?.max ?? "?"}`;
      detailsMarkdown += `**Stress:** ${stressStr}\n\n`;
      if (experiencesStr) {
        detailsMarkdown += `**Experiences:**\n${experiencesStr}\n\n`;
      }
      detailsMarkdown += `**Features:**\n${featuresStr}\n`;
    } else if (actor.type === "environment") {
      detailsMarkdown += `**Tier:** ${actor.tier || "Unknown"}\n`;
      detailsMarkdown += `**Difficulty:** ${actor.difficulty ?? "?"}\n\n`;
      if (actor.impulses) {
        detailsMarkdown += `**Impulses:**\n${actor.impulses}\n\n`;
      }
      detailsMarkdown += `**Features:**\n${featuresStr}\n`;
    } else if (actor.type === "npc") {
      if (actor.motivesAndTactics) {
        detailsMarkdown += `**Motives:**\n${actor.motivesAndTactics}\n\n`;
      }
      if (actor.difficulty) {
        detailsMarkdown += `**Difficulty:** ${actor.difficulty}\n\n`;
      }
      detailsMarkdown += `**Features:**\n${featuresStr}\n\n`;
      if (actor.notes) {
        detailsMarkdown += `**Notes:**\n${actor.notes}\n\n`;
      }
      if (actor.description) {
        detailsMarkdown += `**Description:**\n${actor.description}\n\n`;
      }
      if (actor.biography) {
        detailsMarkdown += `**Biography:**\n${actor.biography}\n`;
      } else {
        detailsMarkdown += "**Biography:** No biography available.\n";
      }
    } else {
      // Default / Character
      const hpStr = `${actor.resources?.hitPoints?.value ?? "?"}/${actor.resources?.hitPoints?.max ?? "?"}`;
      const hopeStr = `${actor.resources?.hope?.value ?? "?"}/${actor.resources?.hope?.max ?? "?"}`;
      const stressStr = `${actor.resources?.stress?.value ?? "?"}/${actor.resources?.stress?.max ?? "?"}`;
      const armorStr = actor.armorScore
        ? `${actor.armorScore.value}/${actor.armorScore.max}`
        : "?";

      let extraStats = "";
      if (actor.resources?.fear) {
        extraStats += `**Fear:** ${actor.resources.fear.value ?? "?"}/${actor.resources.fear.max ?? "?"}\n`;
      }

      const thresholdsStr = actor.thresholds
        ? `Major: ${actor.thresholds.major} | Severe: ${actor.thresholds.severe}`
        : "N/A";

      detailsMarkdown += `**Level:** ${actor.level || "Unknown"}\n`;
      detailsMarkdown += `**Class:** ${actor.class || "Unknown"} ${actor.subclass ? `(${actor.subclass})` : ""}\n`;
      detailsMarkdown += `**Community:** ${actor.community || "Unknown"}\n`;
      detailsMarkdown += `**Ancestry:** ${actor.ancestry || "Unknown"}\n\n`;
      detailsMarkdown += `**Hit Points:** ${hpStr}\n`;
      detailsMarkdown += `**Stress:** ${stressStr}\n`;
      detailsMarkdown += `**Hope:** ${hopeStr}\n`;
      detailsMarkdown += `${extraStats}**Armor Score:** ${armorStr}\n`;
      detailsMarkdown += `**Evasion:** ${actor.evasion ?? "?"}\n`;
      detailsMarkdown += `**Proficiency:** ${actor.proficiency ?? 1}\n`;
      detailsMarkdown += `**Damage Thresholds:** ${thresholdsStr}\n\n`;

      const traits = actor.traits
        ? Object.entries(actor.traits)
            .map(
              ([key, trait]: [string, { value: number }]) =>
                `**${key.toUpperCase()}:** ${trait.value >= 0 ? "+" : ""}${trait.value}`,
            )
            .join("\n")
        : "No traits available";
      detailsMarkdown += `**Traits:**\n${traits}\n\n`;
      if (experiencesStr) {
        detailsMarkdown += `**Experiences:**\n${experiencesStr}\n\n`;
      }
      detailsMarkdown += `**Features:**\n${featuresStr}\n\n`;
      detailsMarkdown += `**Biography:** ${actor.biography || "No biography available."}`;
    }

    return {
      content: [
        {
          type: "text",
          text: detailsMarkdown,
        },
      ],
    };
  });
}
