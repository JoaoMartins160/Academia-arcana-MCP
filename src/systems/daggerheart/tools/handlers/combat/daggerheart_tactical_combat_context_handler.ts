import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { FoundryClient } from "../../../../../foundry/client.js";
import { withToolError } from "../../../../../tools/handlers/utils.js";

interface TacticalCombatant {
  id: string;
  name: string;
  x: number;
  y: number;
  hp: { value: number; max: number };
  stress: { value: number; max: number };
  rangeToTarget?: string;
}

export function calculateDaggerheartRange(dist: number): string {
  if (dist <= 5) return "Melee";
  if (dist <= 15) return "Very Close";
  if (dist <= 30) return "Close";
  if (dist <= 60) return "Far";
  return "Very Far";
}

export function renderAsciiTacticalMap(
  combatants: TacticalCombatant[],
  radius = 20,
): string {
  const size = 11;
  const grid: string[][] = Array.from({ length: size }, () =>
    Array(size).fill("."),
  );

  const centerX = Math.floor(size / 2);
  const centerY = Math.floor(size / 2);
  grid[centerY][centerX] = "+"; // Center marker

  for (let i = 0; i < combatants.length; i++) {
    const c = combatants[i];
    const relX = Math.round((c.x / radius) * (size / 2));
    const relY = Math.round((c.y / radius) * (size / 2));

    const gridX = Math.min(size - 1, Math.max(0, centerX + relX));
    const gridY = Math.min(size - 1, Math.max(0, centerY - relY));

    const symbol = (i + 1).toString();
    grid[gridY][gridX] = symbol;
  }

  const mapLines = grid.map((row) => row.join(" ")).join("\n");
  const legend = combatants
    .map(
      (c, idx) =>
        `[${idx + 1}] ${c.name} (${c.rangeToTarget || "Unknown"}) — HP: ${c.hp.value}/${c.hp.max} | Stress: ${c.stress.value}/${c.stress.max}`,
    )
    .join("\n");

  return `\`\`\`text\n${mapLines}\n\`\`\`\n**Legend & Range Intervals:**\n${legend}`;
}

export async function handleGetDaggerheartCombatTacticalContext(
  args: unknown,
  foundryClient: FoundryClient,
) {
  return withToolError("get Daggerheart tactical combat context", async () => {
    const params = (args as { combatId?: string; zoomRadius?: number }) || {};

    const combatState = await foundryClient.getCombatState();
    if (!combatState) {
      return {
        content: [
          {
            type: "text",
            text: "⚔️ **Daggerheart Tactical Combat**\nNo active combat encounter found in scene.",
          },
        ],
      };
    }

    const combatantsRaw = (combatState.combatants || []) as Array<
      Record<string, unknown>
    >;

    const combatants: TacticalCombatant[] = combatantsRaw.map((c, idx) => {
      const actor = (c.actor as Record<string, unknown>) || {};
      const system = (actor.system as Record<string, unknown>) || {};
      const res = (system.resources as Record<string, unknown>) || {};
      const token = (c.token as Record<string, unknown>) || {};

      const x = (token.x as number) || idx * 10;
      const y = (token.y as number) || idx * 5;

      const hp = (res.hp as { value: number; max: number }) || {
        value: 10,
        max: 10,
      };
      const stress = (res.stress as { value: number; max: number }) || {
        value: 0,
        max: 5,
      };

      const distFromOrigin = Math.sqrt(x * x + y * y);

      return {
        id: (c._id as string) || `c${idx}`,
        name:
          (c.name as string) ||
          (actor.name as string) ||
          `Combatant ${idx + 1}`,
        x,
        y,
        hp,
        stress,
        rangeToTarget: calculateDaggerheartRange(distFromOrigin),
      };
    });

    const asciiMap = renderAsciiTacticalMap(
      combatants,
      params.zoomRadius || 20,
    );

    const text = `⚔️ **Daggerheart Tactical Combat Context**
**Active Encounter:** Round ${combatState.round || 1} | Turn ${combatState.turn || 1}
**Total Combatants:** ${combatants.length}

${asciiMap}`;

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
