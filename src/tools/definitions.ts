/**
 * @fileoverview Tool definitions for FoundryVTT MCP Server
 *
 * This module contains all tool schema definitions organized by category.
 * Tools are separated into logical groups for better maintainability.
 */

/**
 * Dice rolling tool definitions
 */
export const diceTools = [
  {
    name: "roll_dice",
    description: "Roll dice using standard RPG notation (e.g., 1d20, 3d6+4)",
    inputSchema: {
      type: "object",
      properties: {
        formula: {
          type: "string",
          description: 'Dice formula (e.g., "1d20+5", "3d6")',
        },
        reason: {
          type: "string",
          description: "Optional reason for the roll",
        },
      },
      required: ["formula"],
    },
  },
  {
    name: "roll_daggerheart",
    description:
      "RECOMMENDED FOR DAGGERHEART ROLLS: Rolls Hope and Fear dice (2d12) for the Daggerheart system, adding a modifier. Returns the total and whether the outcome was a Success/Failure with Hope or Fear.",
    inputSchema: {
      type: "object",
      properties: {
        modifier: {
          type: "number",
          description:
            "The modifier to add to the 2d12 roll (e.g., agility, strength)",
        },
        reason: {
          type: "string",
          description: "Optional reason for the roll",
        },
      },
      required: ["modifier"],
    },
  },
];

/**
 * Actor management tool definitions
 */
export const actorTools = [
  {
    name: "search_actors",
    description: "Search for actors (characters, NPCs) in FoundryVTT",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for actor names",
        },
        type: {
          type: "string",
          description: "Actor type filter (character, npc, etc.)",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return",
          default: 10,
        },
      },
    },
  },
  {
    name: "get_actor_details",
    description: "Get detailed information about a specific actor",
    inputSchema: {
      type: "object",
      properties: {
        actorId: {
          type: "string",
          description: "The ID of the actor to retrieve",
        },
      },
      required: ["actorId"],
    },
  },
];

/**
 * Actor attribute mutation tool definitions (#143)
 *
 * WRITE operations — require FOUNDRY_WRITE_ENABLED=true and an active
 * Socket.IO connection (mutations use the core `modifyDocument` protocol).
 */
export const actorMutationTools = [
  {
    name: "update_actor_attributes",
    description:
      "Update attributes on an actor's system data. The patch keys are dot-paths into actor.system " +
      '(e.g. "resources.hitPoints.value", "resources.hope.value", "traits.agility.value", "evasion"). ' +
      "Returns the post-update value for every patched path. " +
      "Requires FOUNDRY_WRITE_ENABLED=true and an active Socket.IO connection.",
    inputSchema: {
      type: "object",
      properties: {
        actorId: {
          type: "string",
          description: "The ID of the actor to update",
        },
        patch: {
          type: "object",
          description:
            "Map of dot-path → value, where each dot-path addresses a field under actor.system " +
            '(e.g. {"resources.hitPoints.value": 10, "traits.agility.value": 2}). Values must be number, string, or boolean.',
          additionalProperties: {
            type: ["number", "string", "boolean"],
          },
        },
      },
      required: ["actorId", "patch"],
    },
  },
  {
    name: "create_actor",
    description:
      "Creates a new actor in the game (requires FOUNDRY_WRITE_ENABLED=true and an active Socket.IO connection).",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of the new actor",
        },
        type: {
          type: "string",
          description:
            'The type of actor (e.g. "character", "adversary" for Daggerheart)',
        },
        system: {
          type: "object",
          description: "Optional initial system data object",
        },
        folder: {
          type: "string",
          description: "Optional folder ID or name to place the actor in",
        },
      },
      required: ["name", "type"],
    },
  },
  {
    name: "generate_adversary",
    description:
      "CRITICAL GENERATION TOOL: Generates a complete Daggerheart adversary (NPC/Monster) actor with stats, attack, damage thresholds, and features based on system benchmarks. Use this tool when creating NPCs/monsters for Daggerheart.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of the new adversary",
        },
        difficulty: {
          type: "number",
          description: "The difficulty target number of the adversary",
        },
        tier: {
          type: "number",
          description: "The tier of the adversary (e.g. 1, 2, 3)",
        },
        hitPoints: {
          type: "number",
          description: "The max hit points of the adversary",
        },
        damageThresholds: {
          type: "object",
          description: "Damage thresholds (major, severe)",
          properties: {
            major: { type: "number" },
            severe: { type: "number" },
          },
        },
        motivesAndTactics: {
          type: "string",
          description:
            "Motives and tactics text for the adversary. Must be formatted strictly as HTML.",
        },
        role: {
          type: "string",
          description:
            'The combat role of the adversary (e.g. "skulk", "bruiser", "leader"). Defaults to "standard".',
        },
        size: {
          type: "string",
          description:
            'The physical size of the adversary (e.g. "medium", "large"). Medium/small sets 1x1 token, large sets 2x2.',
        },
        attack: {
          type: "object",
          description:
            "Customized base attack parameters. If omitted, it will be generated via Benchmarks based on tier and role.",
          properties: {
            name: { type: "string" },
            range: { type: "string" },
            modifier: { type: "number", description: "Attack roll bonus (+3)" },
            damageString: {
              type: "string",
              description: 'Damage dice string (e.g. "2d6+3")',
            },
          },
        },
        features: {
          type: "array",
          description:
            "Array of features (and attacks) to add to the adversary. Each will be created as a Daggerheart feature item.",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: {
                type: "string",
                description:
                  "Feature description. Must be formatted strictly as HTML.",
              },
            },
            required: ["name", "description"],
          },
        },
        folder: {
          type: "string",
          description: "Optional folder ID or name to place the adversary in",
        },
      },
      required: ["name"],
    },
  },
];

/**
 * Item management tool definitions
 */
export const itemTools = [
  {
    name: "search_items",
    description: "Search for items in FoundryVTT",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for item names",
        },
        type: {
          type: "string",
          description: "Item type filter (weapon, armor, consumable, etc.)",
        },
        rarity: {
          type: "string",
          description: "Item rarity filter (common, uncommon, rare, etc.)",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return",
          default: 10,
        },
      },
    },
  },
];

/**
 * Compendium search tool definitions (#144)
 */
export const compendiumTools = [
  {
    name: "get_compendiums_list",
    description:
      "Retrieve a list of all available compendium packs from FoundryVTT.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "search_compendium",
    description:
      "CRITICAL LOOKUP TOOL: Search FoundryVTT compendium packs by name and metadata. Always use this to search official compendium items, spells, or features before attempting custom creations.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for compendium entry names",
        },
        filters: {
          type: "object",
          description: "Optional metadata filters to narrow the search",
          properties: {
            compendiumId: {
              type: "string",
              description: "Scope the search to a single compendium pack",
            },
            packType: {
              type: "string",
              description:
                "Pack document type (Item, Actor, JournalEntry, Macro)",
            },
            itemType: {
              type: "string",
              description: "Item type filter (spell, weapon, feat, etc.)",
            },
            spellLevel: {
              type: "number",
              description: "Spell level filter",
            },
            source: {
              type: "string",
              description:
                "Source/rules filter (e.g. a sourcebook abbreviation)",
            },
          },
        },
        limit: {
          type: "number",
          description: "Maximum number of results per page",
          default: 20,
        },
        cursor: {
          type: "string",
          description:
            'Opaque pagination cursor from a prior result\'s "Next page" cursor; omit for the first page',
        },
      },
      required: ["query"],
    },
  },
];

/**
 * Actor item mutation tool definitions (WRITE — require FOUNDRY_WRITE_ENABLED
 * and an active Socket.IO connection; mutations use `modifyDocument`)
 *
 * The canonical mutation target is the Daggerheart item schema. Item
 * `system` patches honour JSON-merge-patch semantics on nested paths.
 */
export const itemMutationTools = [
  {
    name: "create_actor_item",
    description:
      "Create an item on an actor from an inline item document (requires FOUNDRY_WRITE_ENABLED + active Socket.IO connection). Compendium-source create is not yet supported over Socket.IO (see issue #159). Canonical target: Daggerheart item schema.",
    inputSchema: {
      type: "object",
      properties: {
        actorId: {
          type: "string",
          description: "The ID of the actor to add the item to",
        },
        source: {
          type: "object",
          description:
            'Item source: { type: "compendium", compendiumId, itemId } to copy a compendium entry, or { type: "inline", item: { type, name, system } } to create directly',
          properties: {
            type: {
              type: "string",
              enum: ["compendium", "inline"],
              description: "Source kind",
            },
            compendiumId: {
              type: "string",
              description: "Compendium pack id (compendium source)",
            },
            itemId: {
              type: "string",
              description:
                "Item id within the compendium pack (compendium source)",
            },
            item: {
              type: "object",
              description:
                "Inline item document. Required: type, name. Optional: system (validated and defaults injected based on type e.g., weapon requires tier, burden; feature requires featureForm, resource). Foundry will generate internal UUIDs for actions, do not pass actions array unless explicitly copying an existing identical action object.",
              properties: {
                type: { type: "string" },
                name: { type: "string" },
                system: {
                  type: "object",
                  description:
                    'System data for the item. CRITICAL ENUMS FOR DAGGERHEART: range: ["self", "melee", "very close", "close", "far", "very far"]. damage type: ["physical", "magical"]. burden: ["oneHanded", "twoHanded"].',
                },
              },
              required: ["type", "name"],
            },
          },
          required: ["type"],
        },
      },
      required: ["actorId", "source"],
    },
  },
  {
    name: "update_actor_item",
    description:
      "Apply a JSON merge patch to an item's system data on an actor (requires FOUNDRY_WRITE_ENABLED + active Socket.IO connection). Canonical target: Daggerheart item schema.",
    inputSchema: {
      type: "object",
      properties: {
        actorId: {
          type: "string",
          description: "The ID of the actor that owns the item",
        },
        itemId: {
          type: "string",
          description: "The ID of the item to update",
        },
        patch: {
          type: "object",
          description:
            "JSON merge patch applied to item.system; nested paths supported (e.g. system.attack or system.actions.{id})",
        },
      },
      required: ["actorId", "itemId", "patch"],
    },
  },
  {
    name: "delete_actor_item",
    description:
      "Delete an item owned by an actor (requires FOUNDRY_WRITE_ENABLED + active Socket.IO connection). Canonical target: Daggerheart item schema.",
    inputSchema: {
      type: "object",
      properties: {
        actorId: {
          type: "string",
          description: "The ID of the actor that owns the item",
        },
        itemId: {
          type: "string",
          description: "The ID of the item to delete",
        },
      },
      required: ["actorId", "itemId"],
    },
  },
  {
    name: "delete_item",
    description:
      "Delete a standalone world item (requires FOUNDRY_WRITE_ENABLED + active Socket.IO connection).",
    inputSchema: {
      type: "object",
      properties: {
        itemId: {
          type: "string",
          description: "The ID of the world item to delete",
        },
      },
      required: ["itemId"],
    },
  },
];

/**
 * Scene management tool definitions
 */
export const sceneTools = [
  {
    name: "get_scene_info",
    description: "Get information about the current or specified scene",
    inputSchema: {
      type: "object",
      properties: {
        sceneId: {
          type: "string",
          description:
            "Optional scene ID. If not provided, returns current scene",
        },
      },
    },
  },
];

/**
 * Content generation tool definitions
 */
export const generationTools = [
  {
    name: "generate_npc",
    description: "Generate a random NPC with stats and background",
    inputSchema: {
      type: "object",
      properties: {
        level: {
          type: "number",
          description: "Character level (1-20)",
          minimum: 1,
          maximum: 20,
          default: 1,
        },
        race: {
          type: "string",
          description: "Character race (optional)",
        },
        class: {
          type: "string",
          description: "Character class (optional)",
        },
      },
    },
  },
  {
    name: "generate_loot",
    description: "Generate random loot for encounters",
    inputSchema: {
      type: "object",
      properties: {
        challengeRating: {
          type: "number",
          description: "Challenge rating for loot generation",
          minimum: 0,
          maximum: 30,
        },
        treasureType: {
          type: "string",
          description: "Type of treasure (hoard, individual, etc.)",
        },
      },
    },
  },
  {
    name: "lookup_rule",
    description: "Look up game rules and mechanics",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Rule or mechanic to look up",
        },
        system: {
          type: "string",
          description: "Game system (D&D 5e, Pathfinder, etc.)",
        },
      },
      required: ["query"],
    },
  },
];

/**
 * Diagnostics and logging tool definitions
 */
export const diagnosticsTools = [
  {
    name: "get_recent_logs",
    description: "Get recent log entries from FoundryVTT",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of log entries to retrieve",
          default: 20,
          minimum: 1,
          maximum: 100,
        },
        level: {
          type: "string",
          description: "Log level filter (debug, info, warn, error)",
          enum: ["debug", "info", "warn", "error"],
        },
        since: {
          type: "string",
          description: "Get logs since this timestamp (ISO format)",
        },
      },
    },
  },
  {
    name: "search_logs",
    description: "Search through FoundryVTT logs",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for log contents",
        },
        level: {
          type: "string",
          description: "Log level filter",
          enum: ["debug", "info", "warn", "error"],
        },
        limit: {
          type: "number",
          description: "Maximum number of results",
          default: 50,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_system_health",
    description: "Get system health and performance metrics",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "diagnose_errors",
    description:
      "Stub: returns raw logs without analysis. Full diagnostic logic is tracked in #133 and not yet implemented.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Error category to focus on",
        },
      },
    },
  },
  {
    name: "get_health_status",
    description: "Get comprehensive health status of FoundryVTT server",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

/**
 * Combat tool definitions
 */
export const combatTools = [
  {
    name: "get_combat_state",
    description:
      "Get the current active combat state including initiative order, HP, and AC",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

/**
 * Combat control mutation tool definitions (FR-018)
 *
 * WRITE operations — require FOUNDRY_WRITE_ENABLED=true and an active Socket.IO
 * connection (mutations use the core `modifyDocument` protocol). All operate on
 * the *active* combat; the connected user needs GM/owner permission.
 */
export const combatMutationTools = [
  {
    name: "next_turn",
    description:
      "Advance the active combat to the next turn, wrapping to the next round after the last combatant. " +
      "When skipDefeated is true, defeated combatants are skipped. " +
      "Requires FOUNDRY_WRITE_ENABLED=true and an active Socket.IO connection.",
    inputSchema: {
      type: "object",
      properties: {
        skipDefeated: {
          type: "boolean",
          description:
            "Skip combatants flagged as defeated when advancing. Defaults to the combat's skipDefeated setting, or false.",
        },
      },
    },
  },
  {
    name: "end_combat",
    description:
      "End (delete) the active combat encounter. " +
      "Requires FOUNDRY_WRITE_ENABLED=true and an active Socket.IO connection.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "set_initiative",
    description:
      "Set a combatant's initiative in the active combat. " +
      "Requires FOUNDRY_WRITE_ENABLED=true and an active Socket.IO connection.",
    inputSchema: {
      type: "object",
      properties: {
        combatantId: {
          type: "string",
          description: "The ID of the combatant whose initiative to set",
        },
        initiative: {
          type: "number",
          description: "The initiative value to assign",
        },
        combatId: {
          type: "string",
          description:
            "Optional Combat document ID; defaults to the active combat",
        },
      },
      required: ["combatantId", "initiative"],
    },
  },
  {
    name: "start_combat",
    description:
      "Start a new combat encounter, seeding combatants from tokens. " +
      "Provide explicit tokenIds, or omit them to seed every token on the scene. " +
      "Defaults to the active scene when sceneId is omitted. " +
      "Requires FOUNDRY_WRITE_ENABLED=true and an active Socket.IO connection (GM permission).",
    inputSchema: {
      type: "object",
      properties: {
        tokenIds: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional list of Token document IDs to add as combatants. Defaults to all tokens on the scene.",
        },
        sceneId: {
          type: "string",
          description:
            "Optional Scene document ID; defaults to the active scene.",
        },
      },
    },
  },
];

/**
 * Token manipulation mutation tool definitions (FR-019)
 *
 * WRITE operations — require FOUNDRY_WRITE_ENABLED=true and an active Socket.IO
 * connection (mutations use the core `modifyDocument` protocol). The connected
 * user needs GM/owner permission.
 */
export const tokenMutationTools = [
  {
    name: "move_token",
    description:
      "Move a token to new x/y pixel coordinates on its scene. " +
      "The token is located across scenes by id (optionally scoped with sceneId). " +
      "Requires FOUNDRY_WRITE_ENABLED=true and an active Socket.IO connection.",
    inputSchema: {
      type: "object",
      properties: {
        tokenId: {
          type: "string",
          description: "The ID of the token to move",
        },
        x: {
          type: "number",
          description: "Target x pixel coordinate on the scene",
        },
        y: {
          type: "number",
          description: "Target y pixel coordinate on the scene",
        },
        sceneId: {
          type: "string",
          description: "Optional Scene ID to scope the token lookup",
        },
      },
      required: ["tokenId", "x", "y"],
    },
  },
  {
    name: "apply_status_effect",
    description:
      "Apply or remove a status condition (e.g. 'prone', 'stunned') on a token's actor. " +
      "Set active=false to remove. Matches by status id, so re-applying or clearing-when-absent is a no-op. " +
      "Requires FOUNDRY_WRITE_ENABLED=true and an active Socket.IO connection.",
    inputSchema: {
      type: "object",
      properties: {
        tokenId: {
          type: "string",
          description: "The ID of the token whose actor to affect",
        },
        statusId: {
          type: "string",
          description:
            "The status condition id (e.g. 'prone', 'stunned', 'blinded')",
        },
        active: {
          type: "boolean",
          description: "true to apply the effect (default), false to remove it",
          default: true,
        },
        sceneId: {
          type: "string",
          description: "Optional Scene ID to scope the token lookup",
        },
      },
      required: ["tokenId", "statusId"],
    },
  },
];

/**
 * Chat message tool definitions
 */
export const chatTools = [
  {
    name: "get_chat_messages",
    description: "Get recent chat messages from the game",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of messages to retrieve (default 20)",
          default: 20,
          minimum: 1,
          maximum: 100,
        },
      },
    },
  },
];

/**
 * User tool definitions
 */
export const userTools = [
  {
    name: "get_users",
    description: "Get the list of users with their online status and roles",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

/**
 * Journal tool definitions
 */
export const journalTools = [
  {
    name: "search_journals",
    description: "Search journal entries by name or content",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for journal names and content",
        },
        limit: {
          type: "number",
          description: "Maximum number of results",
          default: 10,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_journal",
    description: "Get a specific journal entry with its pages",
    inputSchema: {
      type: "object",
      properties: {
        journalId: {
          type: "string",
          description: "The ID of the journal entry to retrieve",
        },
      },
      required: ["journalId"],
    },
  },
];

/**
 * World-level tool definitions
 */
export const worldTools = [
  {
    name: "search_world",
    description:
      "Search across all collections (actors, items, scenes, journals) by name",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query to match against entity names",
        },
        limit: {
          type: "number",
          description: "Maximum results per collection (default 5)",
          default: 5,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_world_summary",
    description: "Get world metadata and collection counts",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "refresh_world_data",
    description: "Force re-fetch of world data from the FoundryVTT server",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

/**
 * World mutation tools
 */
export const worldMutationTools = [
  {
    name: "create_folder",
    description: "Creates a new folder in FoundryVTT",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Folder name" },
        type: {
          type: "string",
          description: "Document type (e.g. Actor, Item, JournalEntry)",
        },
        parent: {
          type: "string",
          description: "Optional parent folder ID or name",
        },
        color: { type: "string", description: "Optional hex color string" },
      },
      required: ["name", "type"],
    },
  },
  {
    name: "create_item",
    description: "Creates a new standalone item in the world",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        type: { type: "string" },
        system: {
          type: "object",
          description:
            "System data for the item. Validated and defaults injected based on type e.g., weapon requires tier, burden; feature requires featureForm, resource. " +
            "CRITICAL ENUMS FOR DAGGERHEART: " +
            'range: ["self", "melee", "very close", "close", "far", "very far"]. ' +
            'damage type: ["physical", "magical"]. ' +
            'burden: ["oneHanded", "twoHanded"]. ' +
            "Foundry will generate internal UUIDs for actions.",
        },
        folder: { type: "string", description: "Optional folder ID or name" },
      },
      required: ["name", "type"],
    },
  },
  {
    name: "create_journal",
    description: "Creates a new JournalEntry in the world",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        content: {
          type: "string",
          description:
            "HTML content for the initial page. Markdown is NOT supported and will render as raw text.",
        },
        folder: { type: "string", description: "Optional folder ID or name" },
      },
      required: ["name"],
    },
  },
];

/**
 * Daggerheart specialized tool definitions
 */
export const daggerheartTools = [
  {
    name: "daggerheart_create_quest_journal",
    description:
      "Create a formatted Daggerheart Quest & Contract Journal entry with objectives, Hope/Gold rewards, difficulty, and quest giver metadata.",
    inputSchema: {
      type: "object",
      properties: {
        questTitle: { type: "string", description: "Title of the quest" },
        questDescription: {
          type: "string",
          description: "Detailed description of the quest",
        },
        questType: {
          type: "string",
          enum: ["main", "side", "personal", "mystery", "bounty"],
          description: "Type of quest (default: side)",
        },
        difficulty: {
          type: "string",
          enum: ["easy", "medium", "hard", "deadly"],
          description: "Quest difficulty (default: medium)",
        },
        location: { type: "string", description: "Quest setting/location" },
        questGiver: { type: "string", description: "NPC name or quest giver" },
        rewards: {
          type: "string",
          description: "Quest rewards (e.g. 2 Hope, 50 Gold)",
        },
        objectives: {
          type: "array",
          items: { type: "string" },
          description: "List of quest objective items",
        },
        folder: { type: "string", description: "Optional folder ID or name" },
      },
      required: ["questTitle", "questDescription"],
    },
  },
  {
    name: "daggerheart_create_campaign_dashboard",
    description:
      "Create a Daggerheart Campaign Navigation Dashboard Journal with Chapter/Act tracking, Hope/Fear trackers, and session logs index.",
    inputSchema: {
      type: "object",
      properties: {
        campaignTitle: { type: "string", description: "Title of the campaign" },
        campaignDescription: {
          type: "string",
          description: "Theme and summary of the campaign",
        },
        setting: { type: "string", description: "Primary setting or region" },
        template: {
          type: "string",
          enum: ["five-part-adventure", "sandbox", "investigation", "custom"],
          description: "Campaign structure template",
        },
        acts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
            },
            required: ["title", "description"],
          },
          description: "Custom acts/chapters",
        },
        folder: { type: "string", description: "Optional folder ID or name" },
      },
      required: ["campaignTitle", "campaignDescription"],
    },
  },
  {
    name: "daggerheart_create_adversary_spec",
    description:
      "Create a Daggerheart Adversary Actor in Foundry V14 with strict Zod validation, Tier 0-4 power rating, adversary type, attributes, HP/Stress, and soft warnings for custom traits.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Adversary name" },
        tier: {
          type: "number",
          description: "Adversary Tier rating (0 to 4)",
        },
        adversaryType: {
          type: "string",
          enum: ["minion", "social", "standard", "leader", "solo", "horde"],
          description: "Adversary classification type",
        },
        hp: { type: "number", description: "Hit Points value (≥ 1)" },
        stress: { type: "number", description: "Stress capacity (default: 3)" },
        evasion: { type: "number", description: "Evasion score" },
        armor: { type: "number", description: "Armor score (default: 0)" },
        abilities: {
          type: "object",
          properties: {
            agility: { type: "number" },
            strength: { type: "number" },
            finesse: { type: "number" },
            instinct: { type: "number" },
            presence: { type: "number" },
            knowledge: { type: "number" },
          },
          description: "Ability modifiers",
        },
        motives: {
          type: "array",
          items: { type: "string" },
          description: "List of adversary motives/goals",
        },
        experiences: {
          type: "array",
          items: { type: "string" },
          description: "List of adversary experiences",
        },
        attackName: { type: "string", description: "Primary attack name" },
        attackRange: {
          type: "string",
          description: "Attack range (Melee, Very Close, Close, Far, Very Far)",
        },
        damageFormula: {
          type: "string",
          description: "Damage formula (e.g., 2d8+3 physical)",
        },
        folder: { type: "string", description: "Optional folder ID or name" },
      },
      required: ["name", "tier", "adversaryType", "hp", "evasion"],
    },
  },
  {
    name: "daggerheart_get_combat_tactical_context",
    description:
      "Get complete tactical context of active Daggerheart combat, calculating distances into Daggerheart Range Bands (Melee, Very Close, Close, Far, Very Far) and generating an ASCII battlefield grid map.",
    inputSchema: {
      type: "object",
      properties: {
        combatId: {
          type: "string",
          description: "Optional combat encounter ID",
        },
        tokenId: { type: "string", description: "Optional active token ID" },
        zoomRadius: {
          type: "number",
          description: "Tactical view radius (default: 15)",
        },
      },
    },
  },
  {
    name: "daggerheart_roll_duality_extended",
    description:
      "Perform an extended Daggerheart Duality Roll (2d12 Hope vs Fear + modifier) with optional Advantage (+1d6) or Disadvantage (-1d6). Calculates total and Hope/Fear dominance or Duality Match Critical.",
    inputSchema: {
      type: "object",
      properties: {
        modifier: { type: "number", description: "Attribute/action modifier" },
        advantage: {
          type: "boolean",
          description: "Roll +1d6 advantage die",
        },
        disadvantage: {
          type: "boolean",
          description: "Roll -1d6 disadvantage die",
        },
        reason: { type: "string", description: "Reason for the roll" },
      },
    },
  },
  {
    name: "daggerheart_modify_combat_resources",
    description:
      "Modify combat resources (HP, Stress, Hope, Fear, Armor Slots) and status conditions for Daggerheart actors and adversaries.",
    inputSchema: {
      type: "object",
      properties: {
        actorId: { type: "string", description: "Target Actor ID" },
        hpDelta: {
          type: "number",
          description: "Change in HP (e.g. -3 or +2)",
        },
        stressDelta: {
          type: "number",
          description: "Change in Stress (e.g. +1)",
        },
        hopeDelta: {
          type: "number",
          description: "Change in Hope (PC resource 0-6)",
        },
        fearDelta: {
          type: "number",
          description: "Change in Fear (GM resource 0-6)",
        },
        armorDelta: {
          type: "number",
          description: "Change in Armor score",
        },
        statusEffect: {
          type: "string",
          description:
            "Optional status effect label (e.g., Vulnerable, Restrained)",
        },
      },
      required: ["actorId"],
    },
  },
  {
    name: "daggerheart_manage_domain_cards",
    description:
      "Add, equip, or vault Daggerheart Domain Cards (Arcana, Blade, Bone, Codex, Grace, Midnight, Sage, Splendor, Valor) on a character actor.",
    inputSchema: {
      type: "object",
      properties: {
        actorId: { type: "string", description: "Target character actor ID" },
        name: { type: "string", description: "Domain Card name" },
        domain: {
          type: "string",
          description:
            "Domain type (Arcana, Blade, Bone, Codex, Grace, Midnight, Sage, Splendor, Valor)",
        },
        level: {
          type: "number",
          description: "Domain Card required level (1 to 10)",
        },
        hopeCost: { type: "number", description: "Hope activation cost" },
        recallCost: { type: "number", description: "Recall cost" },
        description: { type: "string", description: "Card feature rules text" },
        vaulted: {
          type: "boolean",
          description: "True if stored in Vault, False if equipped",
        },
      },
      required: ["actorId", "name", "domain"],
    },
  },
  {
    name: "daggerheart_roll_table",
    description:
      "Perform a roll on native Daggerheart RollTables (loot tables, random encounters, environmental hazards).",
    inputSchema: {
      type: "object",
      properties: {
        tableNameOrId: {
          type: "string",
          description: "RollTable name or ID in Foundry world data",
        },
      },
      required: ["tableNameOrId"],
    },
  },
  {
    name: "daggerheart_manage_scene_environment",
    description:
      "Control Daggerheart scene activation, atmospheric lighting/darkness, and GM scene notes.",
    inputSchema: {
      type: "object",
      properties: {
        sceneNameOrId: {
          type: "string",
          description: "Target Scene name or ID",
        },
        activate: { type: "boolean", description: "Activate scene" },
        darkness: {
          type: "number",
          description: "Atmospheric darkness level (0.0 to 1.0)",
        },
        noteTitle: { type: "string", description: "GM scene note title" },
        noteContent: { type: "string", description: "GM scene note content" },
      },
      required: ["sceneNameOrId"],
    },
  },
];

/**
 * Get all tool definitions combined
 */
export function getAllTools() {
  return [
    ...diceTools,
    ...actorTools,
    ...actorMutationTools,
    ...itemTools,
    ...compendiumTools,
    ...itemMutationTools,
    ...sceneTools,
    ...combatTools,
    ...combatMutationTools,
    ...tokenMutationTools,
    ...chatTools,
    ...userTools,
    ...journalTools,
    ...worldTools,
    ...worldMutationTools,
    ...generationTools,
    ...diagnosticsTools,
    ...daggerheartTools,
  ];
}

/**
 * Get modernized tool definitions from registry (when available)
 */
export async function getModernizedTools() {
  try {
    const { toolRegistry } = await import("./registry.js");
    const modernTools = toolRegistry.getToolDefinitions();

    // Filter out tools that have been modernized to avoid duplicates
    const modernToolNames = new Set(modernTools.map((tool) => tool.name));
    const legacyTools = getAllTools().filter(
      (tool) => !modernToolNames.has(tool.name),
    );

    return [...modernTools, ...legacyTools];
  } catch (_error) {
    // Fallback to legacy definitions if registry is not available
    return getAllTools();
  }
}
