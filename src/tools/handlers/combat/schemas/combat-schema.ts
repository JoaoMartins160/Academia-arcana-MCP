import { z } from "zod";

export const CombatantSchema = z.object({
	_id: z.string(),
	name: z.string(),
	initiative: z.number().nullable().optional().default(null),
	actorId: z.string().optional().default(""),
	tokenId: z.string().optional().default(""),
	hidden: z.boolean().optional().default(false),
});

export const CombatStateSchema = z.object({
	_id: z.string(),
	round: z.number().int().optional().default(0),
	turn: z.number().int().optional().default(0),
	active: z.boolean().optional().default(false),
	combatants: z.array(CombatantSchema).optional().default([]),
});

export type Combatant = z.infer<typeof CombatantSchema>;
export type CombatState = z.infer<typeof CombatStateSchema>;
