/**
 * @fileoverview Actor item mutation tool handlers (create / update / delete)
 *
 * WRITE operations — require FOUNDRY_WRITE_ENABLED=true and an active Socket.IO
 * connection (mutations use the core `modifyDocument` protocol). The canonical
 * mutation target is the Daggerheart item schema; item `system` patches
 * honour JSON-merge-patch semantics on nested paths such as
 * `system.attack` (weapons) or `system.actions` (features).
 */

import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { FoundryClient } from "../../../foundry/client.js";
import type { ActorItemCreateSource } from "../../../foundry/types.js";
import { withToolError } from "../utils.js";

/**
 * Handles creating an item on an actor from a compendium reference or an inline
 * item document.
 */
export async function handleCreateActorItem(
  args: {
    actorId: string;
    source: ActorItemCreateSource;
  },
  foundryClient: FoundryClient,
) {
  const { actorId, source } = args;

  if (!actorId || typeof actorId !== "string") {
    throw new McpError(
      ErrorCode.InvalidParams,
      "actorId is required and must be a string",
    );
  }
  if (!source || typeof source !== "object") {
    throw new McpError(
      ErrorCode.InvalidParams,
      "source is required and must be an object",
    );
  }
  if (source.type === "compendium") {
    if (
      typeof source.compendiumId !== "string" ||
      typeof source.itemId !== "string"
    ) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "compendium source requires compendiumId and itemId strings",
      );
    }
  } else if (source.type === "inline") {
    if (!source.item || typeof source.item !== "object") {
      throw new McpError(
        ErrorCode.InvalidParams,
        "inline source requires an item object",
      );
    }
  } else {
    throw new McpError(
      ErrorCode.InvalidParams,
      'source.type must be "compendium" or "inline"',
    );
  }

  return withToolError("create item", async () => {
    if (
      source.type === "inline" &&
      source.item &&
      typeof source.item === "object"
    ) {
      const inlineItem = source.item as Record<string, any>;
      const itemType = inlineItem.type;
      if (itemType && typeof itemType === "string") {
        const { parseItemSystemData } = await import(
          "./schemas/item-schema.js"
        );
        inlineItem.system = parseItemSystemData(
          itemType,
          inlineItem.system || {},
        );
      }
    }
    const newItem = await foundryClient.createActorItem(actorId, source);

    const origin =
      source.type === "compendium"
        ? `compendium ${source.compendiumId} / ${source.itemId}`
        : "inline definition";

    return {
      content: [
        {
          type: "text",
          text: `⚔️ **Item Created**
**Actor:** ${actorId}
**Item:** ${newItem.name} (${newItem.type})
**Item ID:** ${newItem._id}
**Source:** ${origin}

_Canonical target: Daggerheart item schema (e.g. type: "weapon" or "feature")._`,
        },
      ],
    };
  });
}

/**
 * Handles applying a JSON merge patch to an item's `system` data. Supports
 * nested paths (e.g. `system.attack` or `system.actions.{id}`).
 */
export async function handleUpdateActorItem(
  args: {
    actorId: string;
    itemId: string;
    patch: Record<string, unknown>;
  },
  foundryClient: FoundryClient,
) {
  const { actorId, itemId, patch } = args;

  if (!actorId || typeof actorId !== "string") {
    throw new McpError(
      ErrorCode.InvalidParams,
      "actorId is required and must be a string",
    );
  }
  if (!itemId || typeof itemId !== "string") {
    throw new McpError(
      ErrorCode.InvalidParams,
      "itemId is required and must be a string",
    );
  }
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "patch is required and must be an object",
    );
  }

  return withToolError("update item", async () => {
    const updatedItem = await foundryClient.updateActorItem(
      actorId,
      itemId,
      patch,
    );

    return {
      content: [
        {
          type: "text",
          text: `⚔️ **Item Updated**
**Actor:** ${actorId}
**Item:** ${updatedItem.name} (${updatedItem.type})
**Item ID:** ${updatedItem._id}
**Patched keys:** ${Object.keys(patch).join(", ") || "(none)"}

_JSON merge patch applied to item.system. Canonical target: Daggerheart item schema._`,
        },
      ],
    };
  });
}

/**
 * Handles deleting an item owned by an actor.
 */
export async function handleDeleteActorItem(
  args: {
    actorId: string;
    itemId: string;
  },
  foundryClient: FoundryClient,
) {
  const { actorId, itemId } = args;

  if (!actorId || typeof actorId !== "string") {
    throw new McpError(
      ErrorCode.InvalidParams,
      "actorId is required and must be a string",
    );
  }
  if (!itemId || typeof itemId !== "string") {
    throw new McpError(
      ErrorCode.InvalidParams,
      "itemId is required and must be a string",
    );
  }

  return withToolError("delete item", async () => {
    await foundryClient.deleteActorItem(actorId, itemId);

    return {
      content: [
        {
          type: "text",
          text: `🗑️ **Item Deleted**
**Actor:** ${actorId}
**Item ID:** ${itemId}

_Canonical target: Daggerheart item schema._`,
        },
      ],
    };
  });
}

/**
 * Handles deleting a standalone world item.
 */
export async function handleDeleteItem(
  args: {
    itemId: string;
  },
  foundryClient: FoundryClient,
) {
  const { itemId } = args;

  if (!itemId || typeof itemId !== "string") {
    throw new McpError(
      ErrorCode.InvalidParams,
      "itemId is required and must be a string",
    );
  }

  return withToolError("delete world item", async () => {
    await foundryClient.deleteItem(itemId);

    return {
      content: [
        {
          type: "text",
          text: `🗑️ **World Item Deleted**
**Item ID:** ${itemId}`,
        },
      ],
    };
  });
}
