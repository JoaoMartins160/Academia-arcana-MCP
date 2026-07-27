/**
 * Shared utilities for tool handlers
 */

import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { logger } from "../../utils/logger.js";

/**
 * Wraps an async handler function with standard error logging and McpError conversion.
 *
 * @param toolName - Label used in error log messages (e.g. 'search actors')
 * @param fn - Async function containing the handler logic
 */
export async function withToolError<T>(
	toolName: string,
	fn: () => Promise<T>,
): Promise<T> {
	try {
		return await fn();
	} catch (error) {
		if (error instanceof McpError) {
			throw error;
		}
		logger.error(`Failed to ${toolName}:`, error);
		throw new McpError(
			ErrorCode.InternalError,
			`Failed to ${toolName}: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

/**
 * Resolves a folder string (either a name or an ID) to a Folder ID.
 * It will search the cached folders from FoundryClient.
 *
 * @param foundryClient - The FoundryClient instance
 * @param folderNameOrId - The name or ID of the folder
 * @param type - The document type the folder should belong to (e.g., 'Actor', 'Item', 'JournalEntry')
 * @returns The resolved folder ID or undefined if not found/provided
 */
export function resolveFolderId(
	foundryClient: any, // using any to avoid circular/deep typing issues here if needed, or we can use FoundryClient
	folderNameOrId?: string,
	type?: string,
): string | undefined {
	if (!folderNameOrId) return undefined;

	const folders = foundryClient.getFolders();

	// Try exact ID match first
	const byId = folders.find(
		(f: any) => f._id === folderNameOrId && (!type || f.type === type),
	);
	if (byId) return byId._id;

	// Try case-insensitive name match
	const lowerName = folderNameOrId.toLowerCase();
	const byName = folders.find(
		(f: any) =>
			f.name?.toLowerCase() === lowerName && (!type || f.type === type),
	);
	if (byName) return byName._id;

	// Fallback: return what was passed, Foundry will reject it if invalid
	return folderNameOrId;
}
