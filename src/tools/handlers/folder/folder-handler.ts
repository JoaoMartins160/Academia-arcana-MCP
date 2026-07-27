import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { FoundryClient } from "../../../foundry/client.js";
import { resolveFolderId, withToolError } from "../utils.js";

export async function handleCreateFolder(
  args: {
    name: string;
    type: string;
    parent?: string;
    color?: string;
  },
  foundryClient: FoundryClient,
) {
  const { name, type, parent, color } = args;

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

  return withToolError("create folder", async () => {
    const parentId = resolveFolderId(foundryClient, parent, type);
    const result = await foundryClient.createFolder(
      name,
      type,
      parentId,
      color,
    );

    return {
      content: [
        {
          type: "text",
          text: `📁 **Folder Created**\n**Name:** ${result.name}\n**ID:** ${result._id}\n**Type:** ${result.type}`,
        },
      ],
    };
  });
}
