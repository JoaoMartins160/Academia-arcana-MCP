/**
 * Tool definitions specific to the Daggerheart RPG system.
 */
export const daggerheartTools = [
  {
    name: "daggerheart_create_quest_journal",
    description:
      "Create a formatted Daggerheart Quest / Session Log entry with trackable quest objectives and rewards.",
    inputSchema: {
      type: "object",
      properties: {
        questTitle: { type: "string", description: "Title of the quest" },
        summary: { type: "string", description: "Brief narrative summary" },
        questType: {
          type: "string",
          enum: ["main", "side", "character", "faction"],
          description: "Type of quest",
        },
        difficulty: {
          type: "string",
          enum: ["easy", "medium", "hard", "deadly"],
          description: "Difficulty tier",
        },
        objectives: {
          type: "array",
          items: { type: "string" },
          description: "List of quest objectives",
        },
        rewards: {
          type: "array",
          items: { type: "string" },
          description: "List of quest rewards",
        },
        folder: { type: "string", description: "Optional folder ID or name" },
      },
      required: ["questTitle", "summary"],
    },
  },
  {
    name: "daggerheart_create_campaign_dashboard",
    description:
      "Create or update a Daggerheart Campaign Dashboard journal entry with Hope/Fear totals, active quests, and countdown clocks.",
    inputSchema: {
      type: "object",
      properties: {
        campaignTitle: { type: "string", description: "Title of campaign" },
        partyHope: {
          type: "number",
          description: "Current party Hope pool",
        },
        gmFear: { type: "number", description: "Current GM Fear pool" },
        activeQuests: {
          type: "array",
          items: { type: "string" },
          description: "List of active quest titles",
        },
        clocks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              progress: { type: "number" },
              max: { type: "number" },
            },
            required: ["name", "progress", "max"],
          },
          description: "List of active campaign countdown clocks",
        },
        folder: { type: "string", description: "Optional folder ID or name" },
      },
      required: ["campaignTitle"],
    },
  },
  {
    name: "daggerheart_create_adversary_spec",
    description:
      "Create a Daggerheart Adversary Actor spec with Tier, Type, Motives, Experiences, and Attack stats according to official benchmarks.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Adversary name" },
        tier: { type: "number", description: "Tier level (0 to 4)" },
        adversaryType: {
          type: "string",
          enum: ["minion", "social", "standard", "leader", "solo", "horde"],
          description: "Adversary archetype category",
        },
        hp: { type: "number", description: "Hit Points" },
        stress: { type: "number", description: "Stress capacity" },
        evasion: { type: "number", description: "Evasion score" },
        armor: { type: "number", description: "Armor score" },
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
        },
        motives: {
          type: "array",
          items: { type: "string" },
          description: "Core motives",
        },
        experiences: {
          type: "array",
          items: { type: "string" },
          description: "Key experiences",
        },
        attackName: { type: "string", description: "Primary attack name" },
        attackRange: { type: "string", description: "Attack range" },
        damageFormula: { type: "string", description: "Damage dice formula" },
        folder: { type: "string", description: "Optional folder ID or name" },
      },
      required: ["name", "tier", "adversaryType", "hp", "evasion"],
    },
  },
  {
    name: "daggerheart_get_combat_tactical_context",
    description:
      "Extract active Daggerheart combatants, distance ranges, environment darkness, and render an ASCII tactical grid map.",
    inputSchema: {
      type: "object",
      properties: {
        combatId: { type: "string", description: "Optional active combat ID" },
        zoomRadius: {
          type: "number",
          description: "Tactical map grid radius in grid units (default: 20)",
        },
      },
    },
  },
  {
    name: "daggerheart_roll_duality_extended",
    description:
      "Execute Daggerheart Duality Roll (2d12: Hope & Fear) with Hope/Fear outcome calculation, Critical success detection, Advantage/Disadvantage, and GM Fear gain reporting.",
    inputSchema: {
      type: "object",
      properties: {
        modifier: { type: "number", description: "Total static modifier" },
        advantage: { type: "boolean", description: "Roll with Advantage" },
        disadvantage: {
          type: "boolean",
          description: "Roll with Disadvantage",
        },
        reason: { type: "string", description: "Purpose or roll context" },
      },
    },
  },
  {
    name: "daggerheart_modify_combat_resources",
    description:
      "Mutate Daggerheart Actor Hope (0-6) or Stress (0-Max) values in real-time.",
    inputSchema: {
      type: "object",
      properties: {
        actorId: { type: "string", description: "Target Actor ID" },
        hopeDelta: {
          type: "number",
          description: "Change in Hope (+1 or -1)",
        },
        stressDelta: {
          type: "number",
          description: "Change in Stress (+1 or -1)",
        },
      },
      required: ["actorId"],
    },
  },
  {
    name: "daggerheart_manage_domain_cards",
    description: "Add, update, or equip Daggerheart Domain Cards on an Actor.",
    inputSchema: {
      type: "object",
      properties: {
        actorId: { type: "string", description: "Target Actor ID" },
        name: { type: "string", description: "Domain Card name" },
        domain: {
          type: "string",
          description:
            "Domain (Arcana, Blade, Bone, Codex, Grace, Midnight, Sage, Splendor, Valor)",
        },
        level: { type: "number", description: "Card Level (1-10)" },
        hopeCost: { type: "number", description: "Hope cost to activate" },
        recallCost: { type: "number", description: "Recall cost" },
        description: {
          type: "string",
          description: "Card feature description",
        },
        vaulted: {
          type: "boolean",
          description: "Vaulted (stored in Vault vs active Loadout)",
        },
      },
      required: ["actorId", "name", "domain"],
    },
  },
  {
    name: "daggerheart_roll_table",
    description:
      "Roll on a Daggerheart RollTable (e.g. Loot, Encounters, Mishaps) and return the evaluated result text.",
    inputSchema: {
      type: "object",
      properties: {
        tableNameOrId: {
          type: "string",
          description: "Target RollTable name or ID",
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
  {
    name: "daggerheart_apply_damage_with_thresholds",
    description:
      "Calculate damage against Daggerheart Minor/Major/Severe Thresholds, apply optional Armor Slot mitigation, and update target Actor HP.",
    inputSchema: {
      type: "object",
      properties: {
        actorId: { type: "string", description: "Target Actor ID" },
        damageTotal: { type: "number", description: "Total damage value" },
        damageType: {
          type: "string",
          enum: ["physical", "magic"],
          description: "Damage type (physical or magic)",
        },
        useArmorSlot: {
          type: "boolean",
          description: "Use an Armor Slot to reduce damage category",
        },
        armorSlotCost: {
          type: "number",
          description: "Number of Armor Slots to spend (default: 1)",
        },
      },
      required: ["actorId", "damageTotal"],
    },
  },
  {
    name: "daggerheart_manage_action_tracker",
    description:
      "Track Player Action Tokens and GM Fear Tokens for Daggerheart non-initiative combat flow.",
    inputSchema: {
      type: "object",
      properties: {
        actionDelta: {
          type: "number",
          description: "Change in Action Tokens (+1 when player acts)",
        },
        fearDelta: {
          type: "number",
          description:
            "Change in GM Fear Pool (-1 when spending Fear for Adversary move)",
        },
        reason: {
          type: "string",
          description: "Reason for action/fear change",
        },
      },
    },
  },
  {
    name: "daggerheart_create_character",
    description:
      "Guided creation of complete Daggerheart Player Characters (PCs) with Ancestry, Community, Class, Subclass, and the 6 Core Ability Modifiers.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Character name" },
        ancestry: {
          type: "string",
          description: "Ancestry (Elf, Dwarf, Clank, Ribbet, Human, Orc, etc.)",
        },
        community: {
          type: "string",
          description:
            "Community (Seaborne, Ridgeborne, Wildborne, Underborne, etc.)",
        },
        className: {
          type: "string",
          description:
            "Class (Bard, Druid, Guardian, Ranger, Rogue, Seraph, Sorcerer, Warrior, Wizard)",
        },
        subclassName: { type: "string", description: "Optional subclass name" },
        level: { type: "number", description: "Character level (1 to 10)" },
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
          description: "Core ability modifiers",
        },
        hp: {
          type: "number",
          description: "Hit Points capacity (default: 12)",
        },
        stress: { type: "number", description: "Stress capacity (default: 5)" },
        evasion: { type: "number", description: "Evasion score (default: 10)" },
        armor: { type: "number", description: "Armor score (default: 2)" },
        folder: { type: "string", description: "Optional folder ID or name" },
      },
      required: ["name", "ancestry", "community", "className"],
    },
  },
  {
    name: "daggerheart_invoke_experience",
    description:
      "Invoke a character Experience (spending 1 Hope) to add experience modifier bonus to Duality rolls.",
    inputSchema: {
      type: "object",
      properties: {
        actorId: { type: "string", description: "Character Actor ID" },
        experienceName: {
          type: "string",
          description: "Name of the Experience",
        },
        modifier: {
          type: "number",
          description: "Experience bonus modifier (+2 default)",
        },
        spendHope: {
          type: "boolean",
          description: "Deduct 1 Hope (default: true)",
        },
      },
      required: ["actorId", "experienceName"],
    },
  },
  {
    name: "daggerheart_search_compendium",
    description:
      "Specialized search in Daggerheart compendiums filtering by Item Type (domainCard, weapon, etc.), Domain, Level, or Attack Range.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query text" },
        itemType: {
          type: "string",
          enum: [
            "domainCard",
            "ancestry",
            "community",
            "class",
            "subclass",
            "weapon",
            "armor",
            "feature",
          ],
          description: "Daggerheart item type filter",
        },
        domain: {
          type: "string",
          description: "Domain filter (Arcana, Grace, etc.)",
        },
        level: { type: "number", description: "Level filter (1 to 10)" },
        attackRange: {
          type: "string",
          description: "Attack range filter (Melee, Close, Far)",
        },
      },
    },
  },
  {
    name: "daggerheart_execute_action_graph",
    description:
      "Execute a declarative Action Graph workflow pipeline chaining multiple MCP tools in sequence with template variable resolution.",
    inputSchema: {
      type: "object",
      properties: {
        graphName: { type: "string", description: "Workflow graph title" },
        stopOnError: {
          type: "boolean",
          description: "Halt workflow if any node fails (default: true)",
        },
        nodes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Node unique ID" },
              toolName: { type: "string", description: "MCP tool name" },
              args: { type: "object", description: "Tool arguments" },
              dependsOn: {
                type: "array",
                items: { type: "string" },
                description: "Node dependencies",
              },
            },
            required: ["id", "toolName"],
          },
          description: "Array of workflow graph nodes",
        },
      },
      required: ["nodes"],
    },
  },
  {
    name: "daggerheart_pipeline_encounter_setup",
    description:
      "Macro Pipeline: Automate full Daggerheart encounter setup (Create Adversaries + Scene Lighting + Start Combat + Tactical ASCII Map + Quest Journal in 1 step).",
    inputSchema: {
      type: "object",
      properties: {
        encounterName: { type: "string", description: "Encounter title" },
        adversaryName: { type: "string", description: "Leader adversary name" },
        sceneName: { type: "string", description: "Target scene name" },
      },
    },
  },
  {
    name: "daggerheart_pipeline_full_character_onboarding",
    description:
      "Macro Pipeline: Automate full Daggerheart PC onboarding (Create PC Actor + Domain Cards + HP/Hope Resources in 1 step).",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Character name" },
        ancestry: {
          type: "string",
          description: "Ancestry (Elf, Dwarf, etc.)",
        },
        community: {
          type: "string",
          description: "Community (Seaborne, etc.)",
        },
        className: { type: "string", description: "Class (Wizard, etc.)" },
        domain: { type: "string", description: "Initial Domain Card" },
      },
    },
  },
];
