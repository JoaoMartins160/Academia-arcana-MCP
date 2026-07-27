import { z } from "zod";

function generateValidAction(systemPath = "actions") {
  const id = Math.random().toString(36).substring(2, 18).padEnd(16, "0");
  return {
    _id: id,
    systemPath: systemPath,
    type: "attack",
    baseAction: true,
    name: "Attack",
    actionType: "action",
    chatDisplay: false,
    range: "melee",
    description: "",
    originItem: null,
    triggers: [],
    areas: [],
    cost: [],
    uses: { value: 0, max: "" },
    damage: {
      includeBase: false,
      direct: false,
      parts: {
        hitPoints: {
          applyTo: "hitPoints",
          resultBased: false,
          value: { custom: { enabled: false }, multiplier: "prof", dice: "d8" },
          valueAlt: null,
          base: null,
          type: ["physical"],
        },
      },
    },
    effects: [],
    roll: {
      trait: "agility",
      type: "attack",
      advState: "neutral",
      diceRolling: {
        multiplier: "prof",
        flatMultiplier: 1,
        dice: "d6",
        compare: null,
        treshold: null,
      },
      useDefault: false,
    },
    save: { trait: null },
  };
}

function generateDefaultWeaponAction() {
  const action = generateValidAction("actions");
  return { [action._id]: action };
}

const HtmlStringSchema = z
  .string()
  .refine((val) => !/(\*\*|##|__)/.test(val), {
    message:
      "Markdown is NOT supported by FoundryVTT. You MUST use HTML tags (e.g. <p>, <b>, <h1>) instead of Markdown symbols.",
  })
  .optional()
  .default("");

export const BaseItemSchema = z
  .object({
    description: HtmlStringSchema,
    attribution: z
      .object({
        source: z.string().optional().default(""),
        page: z.number().optional().default(0),
        artist: z.string().optional().default(""),
      })
      .optional()
      .default({ source: "", page: 0, artist: "" }),
  })
  .passthrough();

export const InventoryItemSchema = BaseItemSchema.extend({
  quantity: z.number().int().min(0).optional().default(1),
}).passthrough();

export const AncestrySchema = BaseItemSchema.extend({
  features: z.array(z.any()).optional().default([]),
}).passthrough();

export const ClassSchema = BaseItemSchema.extend({
  features: z.array(z.any()).optional().default([]),
  subclass: z.array(z.any()).optional().default([]),
}).passthrough();

export const SubclassSchema = BaseItemSchema.extend({
  features: z.array(z.any()).optional().default([]),
}).passthrough();

export const CommunitySchema = BaseItemSchema.extend({
  features: z.array(z.any()).optional().default([]),
}).passthrough();

export const BeastformSchema = z
  .object({
    attribution: BaseItemSchema.shape.attribution,
    beastformType: z.string().optional().default("normal"),
    tier: z.number().optional().default(1),
    tokenImg: z.string().optional().default("icons/svg/mystery-man.svg"),
    tokenRingImg: z.string().optional().default("icons/svg/mystery-man.svg"),
  })
  .passthrough();

export const DomainCardSchema = BaseItemSchema.extend({
  domain: z.string().optional().default("arcana"),
  level: z.number().int().optional().default(1),
  recallCost: z.number().int().optional().default(0),
  type: z.string().optional().default("ability"),
  inVault: z.boolean().optional().default(false),
  vaultActive: z.boolean().optional().default(false),
  loadoutIgnore: z.boolean().optional().default(false),
}).passthrough();

export const FeatureSchema = BaseItemSchema.extend({
  originItemType: z.string().nullable().optional().default(null),
  multiclassOrigin: z.boolean().optional().default(false),
  identifier: z.string().optional().default(""),
  featureForm: z.string().optional().default("passive"), // passive, action, reaction
  resource: z
    .object({
      type: z.string().optional().default("simple"),
      value: z.number().optional().default(0),
      max: z.number().nullable().optional().default(null),
      icon: z.string().optional().default(""),
      recovery: z.string().nullable().optional().default(null),
      progression: z.string().optional().default("increasing"),
      diceStates: z.record(z.string(), z.any()).optional().default({}),
      dieFaces: z.string().optional().default("d4"),
    })
    .nullable()
    .optional()
    .default(null),
  actions: z.any().optional(), // Deixe o Foundry gerenciar as actions nativamente
}).passthrough();

export const ArmorSchema = InventoryItemSchema.extend({
  tier: z.number().int().min(1).optional().default(1),
  equipped: z.boolean().optional().default(false),
  armor: z
    .object({
      current: z.number().int().min(0).optional().default(0),
      max: z.number().int().optional().default(0),
    })
    .optional()
    .default({ current: 0, max: 0 }),
  baseThresholds: z
    .object({
      major: z.number().int().optional().default(0),
      severe: z.number().int().optional().default(0),
    })
    .optional()
    .default({ major: 0, severe: 0 }),
  armorFeatures: z.array(z.any()).optional().default([]),
}).passthrough();

export const ConsumableSchema = InventoryItemSchema.extend({
  tier: z.number().int().min(1).optional().default(1),
}).passthrough();

export const LootSchema = InventoryItemSchema; // just quantity

export const WeaponSchema = InventoryItemSchema.extend({
  tier: z.number().int().min(1).optional().default(1),
  equipped: z.boolean().optional().default(false),
  secondary: z.boolean().optional().default(false),
  burden: z.string().optional().default("oneHanded"),
  weaponFeatures: z
    .array(
      z.object({
        value: z.string(),
        effectIds: z.array(z.string()).optional().default([]),
        actionIds: z.array(z.string()).optional().default([]),
      }),
    )
    .optional()
    .default([]),
  rules: z
    .object({
      attack: z
        .object({
          roll: z
            .object({
              trait: z.string().nullable().optional().default(null),
            })
            .optional()
            .default({ trait: null }),
        })
        .optional()
        .default({ roll: { trait: null } }),
    })
    .optional()
    .default({ attack: { roll: { trait: null } } }),
  attack: z
    .any()
    .optional()
    .default(() => generateValidAction("attack")), // Sobrescreve o default bugado do Daggerheart
  actions: z
    .record(z.string(), z.any())
    .optional()
    .default(() => generateDefaultWeaponAction()), // Força a criação de uma ação válida para evitar bugs no Daggerheart
}).passthrough();

export const ItemSchemas: Record<string, z.ZodTypeAny> = {
  ancestry: AncestrySchema,
  beastform: BeastformSchema,
  class: ClassSchema,
  subclass: SubclassSchema,
  community: CommunitySchema,
  domainCard: DomainCardSchema,
  feature: FeatureSchema,
  armor: ArmorSchema,
  consumable: ConsumableSchema,
  loot: LootSchema,
  weapon: WeaponSchema,
};

/**
 * Validates and injects defaults for the item's system payload.
 * Unknown properties are stripped.
 */
export function parseItemSystemData(
  type: string,
  data: Record<string, unknown> = {},
): Record<string, unknown> {
  const schema = ItemSchemas[type];
  if (!schema) {
    // If unknown type, return as is
    return data;
  }

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new Error(
      `Invalid system data for item type '${type}'. ${parsed.error.message}`,
    );
  }
  return parsed.data as Record<string, unknown>;
}
