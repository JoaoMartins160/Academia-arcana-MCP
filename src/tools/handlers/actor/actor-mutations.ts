/**
 * @fileoverview Actor attribute mutation tool handlers (#143)
 *
 * Handles patching attributes on an actor's `system` object via dot-paths.
 * WRITE operation — requires FOUNDRY_WRITE_ENABLED=true and an active Socket.IO
 * connection (mutations use the core `modifyDocument` protocol).
 */

import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { AttributePatch, FoundryClient } from "../../../foundry/client.js";
import { resolveFolderId, withToolError } from "../utils.js";

/**
 * Handles actor attribute update requests.
 *
 * `patch` keys are dot-paths into the actor's `system` object — e.g.
 * `attributes.hp.value`, `attributes.hp.temp`, `currency.gp`,
 * `resources.primary.value`, `spells.spell1.value`, `attributes.exhaustion`.
 * The post-update value of every patched path is echoed back.
 */
export async function handleUpdateActorAttribute(
	args: {
		actorId: string;
		patch: AttributePatch;
	},
	foundryClient: FoundryClient,
) {
	const { actorId, patch } = args;

	if (!actorId || typeof actorId !== "string") {
		throw new McpError(
			ErrorCode.InvalidParams,
			"actorId is required and must be a string",
		);
	}
	if (
		patch === null ||
		typeof patch !== "object" ||
		Array.isArray(patch) ||
		Object.keys(patch).length === 0
	) {
		throw new McpError(
			ErrorCode.InvalidParams,
			"patch is required and must be a non-empty object of dot-path attributes",
		);
	}

	return withToolError("update actor attributes", async () => {
		const result = await foundryClient.updateActorAttribute(actorId, patch);

		const updatedList = Object.entries(result.updatedAttributes)
			.map(([path, value]) => `- **${path}** → ${String(value)}`)
			.join("\n");

		return {
			content: [
				{
					type: "text",
					text: `⚔️ **Actor Attributes Updated**\n**Actor ID:** ${actorId}\n**Status:** ${result.success ? "Success" : "Failed"}\n\n**Updated attributes** (dot-paths into actor.system):\n${updatedList}`,
				},
			],
		};
	});
}

export async function handleCreateActor(
	args: {
		name: string;
		type: string;
		system?: Record<string, unknown>;
		folder?: string;
	},
	foundryClient: FoundryClient,
) {
	const { name, type, system, folder } = args;

	if (!name || typeof name !== "string") {
		throw new McpError(
			ErrorCode.InvalidParams,
			"name is required and must be a string",
		);
	}
	if (!type || typeof type !== "string") {
		throw new McpError(
			ErrorCode.InvalidParams,
			"type is required and must be a string",
		);
	}

	return withToolError("create actor", async () => {
		const { parseActorSystemData } = await import("./schemas/actor-schema.js");
		const parsedSystem = parseActorSystemData(type, system || {});

		const resolvedFolderId = resolveFolderId(foundryClient, folder, "Actor");
		const result = await foundryClient.createActor(
			name,
			type,
			parsedSystem,
			resolvedFolderId,
		);

		return {
			content: [
				{
					type: "text",
					text: `⚔️ **Actor Created**\n**Name:** ${result.name}\n**ID:** ${result._id}\n**Type:** ${result.type}`,
				},
			],
		};
	});
}
