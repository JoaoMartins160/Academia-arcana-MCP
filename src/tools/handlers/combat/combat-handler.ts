/**
 * Combat state tool handler
 */

import type { FoundryClient } from "../../../foundry/client.js";
import { withToolError } from "../utils.js";

export async function handleGetCombatState(
	_args: Record<string, unknown>,
	foundryClient: FoundryClient,
) {
	return withToolError("get combat state", async () => {
		const combat = foundryClient.getCombatState();

		if (!combat) {
			return {
				content: [{ type: "text", text: "No active combat encounter." }],
			};
		}

		const combatants = combat.combatants
			.sort((a, b) => (b.initiative ?? -999) - (a.initiative ?? -999))
			.map((c, i) => {
				const current = combat.turn === i ? " <-- CURRENT" : "";
				const status = c.defeated ? " [DEFEATED]" : c.hidden ? " [HIDDEN]" : "";
				const init = c.initiative !== null ? c.initiative.toString() : "?";

				// Try to get HP/AC from worldData if actor is linked
				let hpAc = "";
				if (c.actorId) {
					const actor = foundryClient.getRawActor(c.actorId);
					if (actor) {
						const resources = actor.system?.resources as
							| Record<string, unknown>
							| undefined;
						const hpData = resources?.hitPoints as
							| { value?: number; max?: number }
							| undefined;
						const armorScore = actor.system?.armorScore as
							| { value?: number }
							| undefined;
						const evasion = actor.system?.evasion as number | undefined;

						if (hpData) {
							hpAc += ` HP: ${hpData.value ?? "?"}/${hpData.max ?? "?"}`;
						}
						if (armorScore !== undefined || evasion !== undefined) {
							hpAc += ` (Armor: ${armorScore?.value ?? "?"}, Eva: ${evasion ?? "?"})`;
						}
					}
				}

				return `${i + 1}. [${init}] **${c.name}**${hpAc}${status}${current}`;
			})
			.join("\n");

		return {
			content: [
				{
					type: "text",
					text: `**Active Combat** — Round ${combat.round}\n\n${combatants}`,
				},
			],
		};
	});
}
