/**
 * @fileoverview Item management tool handlers
 *
 * Handles searching for items and retrieving detailed item information.
 */

import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { FoundryClient } from "../../../foundry/client.js";
import { resolveFolderId, withToolError } from "../utils.js";

/**
 * Handles item search requests
 */
export async function handleSearchItems(
	args: {
		query?: string;
		type?: string;
		rarity?: string;
		limit?: number;
	},
	foundryClient: FoundryClient,
) {
	const { query, type, rarity, limit = 10 } = args;

	return withToolError("search items", async () => {
		const searchParams: {
			query: string;
			type?: string;
			rarity?: string;
			limit: number;
		} = {
			query: query || "",
			limit,
		};
		if (type) {
			searchParams.type = type;
		}
		if (rarity) {
			searchParams.rarity = rarity;
		}
		const result = await foundryClient.searchItems(searchParams);

		const itemList = result.items
			.map((item) => {
				const tier = item.tier ? `Tier ${item.tier}` : "No Tier";
				const burden = item.burden ? `Burden: ${item.burden}` : "";
				return `- **${item.name}** (${item.type}) - ${tier} - ${burden}`;
			})
			.join("\n");

		return {
			content: [
				{
					type: "text",
					text: `⚔️ **Item Search Results**
**Query:** ${query || "All items"}
**Type Filter:** ${type || "All types"}
**Rarity Filter:** ${rarity || "All rarities"}
**Results:** ${result.items.length}/${result.total} total

${itemList || "No items found matching the criteria."}

**Page:** ${result.page} | **Limit:** ${result.limit}`,
				},
			],
		};
	});
}

export async function handleCreateItem(
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

	return withToolError("create item", async () => {
		const { parseItemSystemData } = await import("./schemas/item-schema.js");
		const parsedSystem = parseItemSystemData(type, system || {});

		const resolvedFolderId = resolveFolderId(foundryClient, folder, "Item");
		const result = await foundryClient.createItem(
			name,
			type,
			parsedSystem,
			resolvedFolderId,
		);

		return {
			content: [
				{
					type: "text",
					text: `🎒 **Item Created**\n**Name:** ${result.name}\n**ID:** ${result._id}\n**Type:** ${result.type}`,
				},
			],
		};
	});
}
