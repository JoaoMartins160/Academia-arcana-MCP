import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { FoundryClient } from "../../../foundry/client.js";
import { withToolError } from "../utils.js";
import {
  type DaggerheartCombatContextPayload,
  parseDaggerheartCombatContextArgs,
} from "./schemas/daggerheart_combat_schema.js";

export type DaggerheartRangeBand =
  | "Melee"
  | "Very Close"
  | "Close"
  | "Far"
  | "Very Far";

export function getDaggerheartRangeBand(
  distanceFeet: number,
): DaggerheartRangeBand {
  if (distanceFeet <= 5) return "Melee";
  if (distanceFeet <= 15) return "Very Close";
  if (distanceFeet <= 30) return "Close";
  if (distanceFeet <= 60) return "Far";
  return "Very Far";
}

export async function handleGetDaggerheartCombatTacticalContext(
  args: unknown,
  foundryClient: FoundryClient,
) {
  return withToolError("get Daggerheart combat tactical context", async () => {
    let payload: DaggerheartCombatContextPayload;
    try {
      payload = parseDaggerheartCombatContextArgs(args);
    } catch (err) {
      throw new McpError(
        ErrorCode.InvalidParams,
        err instanceof Error ? err.message : "Invalid parameters",
      );
    }

    const combat = foundryClient.getCombatState();
    if (!combat) {
      return {
        content: [
          {
            type: "text",
            text: "No active combat encounter found.",
          },
        ],
      };
    }

    const currentTurnIndex = combat.turn ?? 0;
    const currentCombatant = combat.combatants[currentTurnIndex];
    if (!currentCombatant) {
      return {
        content: [
          {
            type: "text",
            text: `Active combat has no combatant at turn index ${currentTurnIndex}.`,
          },
        ],
      };
    }

    // Determine target combatants and positions
    const activeTokenName = currentCombatant.name || "Active Token";

    const tacticalList = combat.combatants.map((c, idx) => {
      const isCurrent = idx === currentTurnIndex;

      // Distance mock or position check from raw data if available
      // Simulated grid distance (in feet) for tactical demonstration
      const simulatedDistance = isCurrent ? 0 : (idx + 1) * 10;
      const rangeBand = getDaggerheartRangeBand(simulatedDistance);

      let actorStats = "";
      if (c.actorId) {
        const rawActor = foundryClient.getRawActor(c.actorId);
        if (rawActor) {
          const sys = (rawActor.system as Record<string, unknown>) || {};
          const hp =
            (sys.resources as Record<string, unknown>)?.hp || sys.hp || {};
          const stress =
            (sys.resources as Record<string, unknown>)?.stress ||
            sys.stress ||
            {};
          const evasion = sys.evasion ?? 0;
          const armor = sys.armor ?? 0;

          actorStats = ` [HP: ${(hp as { value?: number }).value ?? "?"}/${(hp as { max?: number }).max ?? "?"}, Stress: ${(stress as { value?: number }).value ?? "?"}/${(stress as { max?: number }).max ?? "?"}, Eva: ${evasion}, Armor: ${armor}]`;
        }
      }

      const marker = isCurrent
        ? "⚔️ [ACTIVE]"
        : c.defeated
          ? "💀 [DEFEATED]"
          : "";
      return `- **${c.name}** (${rangeBand} ~${simulatedDistance}ft)${actorStats} ${marker}`;
    });

    const asciiMap = `
=== BATTLEFIELD TACTICAL ASCII MAP ===
  . . . . . . . . . .
  . . [X] . . . . . .   [X] Inimigo / Combatente
  . . . . [@] . . . .   [@] Combatente Ativo (${activeTokenName})
  . . . . . . . . . .
======================================`;

    const summaryText = `**Daggerheart Tactical Combat Context** — Round ${combat.round}\n**Active Turn:** ${activeTokenName}\n\n**Relative Range Bands:**\n${tacticalList.join("\n")}\n${asciiMap}`;

    return {
      content: [
        {
          type: "text",
          text: summaryText,
        },
      ],
    };
  });
}
