import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { FoundryClient } from "../../../foundry/client.js";
import { resolveFolderId, withToolError } from "../utils.js";
import {
  ADVERSARY_BENCHMARKS,
  getMidpoint,
  parseDiceString,
} from "./adversary-benchmarks.js";

export async function handleCreateAdversary(
  args: {
    name: string;
    difficulty?: number;
    tier?: number;
    hitPoints?: number;
    damageThresholds?: { major?: number; severe?: number };
    motivesAndTactics?: string;
    role?: string;
    size?: string;
    attack?: {
      name?: string;
      range?: string;
      modifier?: number;
      damageString?: string;
    };
    features?: Array<{ name: string; description: string }>;
    folder?: string;
  },
  foundryClient: FoundryClient,
) {
  const {
    name,
    difficulty,
    tier,
    hitPoints,
    damageThresholds,
    motivesAndTactics,
    role,
    size,
    attack,
    features,
    folder,
  } = args;

  if (!name || typeof name !== "string") {
    throw new McpError(
      ErrorCode.InvalidParams,
      "name is required and must be a string",
    );
  }

  if (motivesAndTactics && /(\*\*|##|__)/.test(motivesAndTactics)) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Markdown is NOT supported by FoundryVTT. You MUST format motivesAndTactics using HTML tags.",
    );
  }

  if (features?.some((f) => /(\*\*|##|__)/.test(f.description))) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Markdown is NOT supported by FoundryVTT. You MUST format feature descriptions using HTML tags.",
    );
  }

  return withToolError("create adversary", async () => {
    // Determine benchmark values
    const safeTier = tier ?? 1;
    const safeRole = role ?? "standard";
    const benchmark = ADVERSARY_BENCHMARKS[safeRole]?.[safeTier] ||
      ADVERSARY_BENCHMARKS.standard?.[safeTier] ||
      ADVERSARY_BENCHMARKS.standard?.[1] || {
        hp: [5, 5],
        difficulty: [10, 10],
      };

    const finalHP = hitPoints ?? getMidpoint(benchmark.hp) ?? 5;
    const finalDiff = difficulty ?? getMidpoint(benchmark.difficulty) ?? 12;
    const finalMajor =
      damageThresholds?.major ?? getMidpoint(benchmark.major) ?? null;
    const finalSevere =
      damageThresholds?.severe ?? getMidpoint(benchmark.severe) ?? null;
    const finalStress = getMidpoint(benchmark.stress) ?? null;

    // Determine attack parameters
    const atkName = attack?.name ?? "Base Attack";
    const atkRange = attack?.range ?? "melee";
    const atkMod = attack?.modifier ?? getMidpoint(benchmark.atk) ?? 0;
    const atkDiceStr =
      attack?.damageString ?? (benchmark?.dice ? benchmark.dice[0] : "1d8");

    const parsedDice = atkDiceStr ? parseDiceString(atkDiceStr) : null;
    const damageParts: any = {};

    if (parsedDice) {
      damageParts.hitPoints = {
        applyTo: "hitPoints",
        resultBased: false,
        value: {
          multiplier: "flat",
          flatMultiplier: parsedDice.multiplier
            ? Number.parseInt(parsedDice.multiplier)
            : 1,
          dice: parsedDice.dice || "d6",
          bonus: parsedDice.bonus || null,
          custom: parsedDice.custom || "",
        },
        valueAlt: {
          multiplier: "flat",
          flatMultiplier: null,
          dice: "d6",
          bonus: null,
          custom: "",
        },
        base: false,
      };
    }

    // 1. Prepare system data with default attack to satisfy Daggerheart validation
    const defaultAttack = {
      name: atkName,
      type: "attack",
      range: atkRange,
      baseAction: false,
      description: "",
      originItem: { type: "itemCollection" },
      actionType: "action",
      triggers: [],
      areas: [],
      cost: [],
      uses: { value: null, max: null, recovery: null, consumeOnSuccess: false },
      damage: { parts: damageParts, includeBase: false, direct: false },
      effects: [],
      roll: {
        type: "attack",
        trait: null,
        difficulty: null,
        bonus: atkMod,
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
      save: { trait: null, difficulty: null, damageMod: "none" },
    };

    const system: Record<string, any> = {
      attack: defaultAttack,
      role: safeRole,
      size: size ?? "medium",
    };

    const resolvedFolderId = resolveFolderId(foundryClient, folder, "Actor");

    const actor = await foundryClient.createActor(
      name,
      "adversary",
      system,
      resolvedFolderId,
    );
    const actorId = actor._id;

    if (!actorId) {
      throw new Error("Failed to retrieve ID for created adversary");
    }

    // 2. Prepare and apply system attribute updates
    const patch: Record<string, string | number | boolean> = {};
    patch.difficulty = finalDiff;
    patch.tier = safeTier;

    if (motivesAndTactics !== undefined)
      patch.motivesAndTactics = motivesAndTactics;

    patch["resources.hitPoints.max"] = finalHP;
    patch["resources.hitPoints.value"] = finalHP;

    if (finalStress !== null) {
      patch["resources.stress.max"] = finalStress;
      patch["resources.stress.value"] = 0;
    }

    if (finalMajor !== null) patch["damageThresholds.major"] = finalMajor;
    if (finalSevere !== null) patch["damageThresholds.severe"] = finalSevere;

    // Map size to token dimensions
    const sizeMap: Record<string, number> = {
      tiny: 0.5,
      small: 1,
      medium: 1,
      large: 2,
      huge: 3,
      gargantuan: 4,
    };
    const tokenDim = sizeMap[(size ?? "medium").toLowerCase()] || 1;
    patch["prototypeToken.width"] = tokenDim;
    patch["prototypeToken.height"] = tokenDim;

    if (Object.keys(patch).length > 0) {
      await foundryClient.updateActorAttribute(actorId, patch);
    }

    // 3. Create features
    const createdFeatures = [];
    if (features && Array.isArray(features)) {
      for (const feat of features) {
        if (!feat.name || !feat.description) continue;

        const itemSource = {
          type: "inline" as const,
          item: {
            name: feat.name,
            type: "feature",
            system: {
              description: feat.description,
              featureForm: "passive",
            },
          },
        };

        try {
          const newItem = await foundryClient.createActorItem(
            actorId,
            itemSource,
          );
          createdFeatures.push(newItem.name);
        } catch (error) {
          console.error(
            `Failed to create feature ${feat.name} for adversary ${actorId}`,
            error,
          );
        }
      }
    }

    return {
      content: [
        {
          type: "text",
          text: `💀 **Adversary Created Successfully**
**Name:** ${name}
**ID:** ${actorId}
**Tier:** ${safeTier} | **Difficulty:** ${finalDiff} | **HP:** ${finalHP}
**Features Added:** ${createdFeatures.length > 0 ? createdFeatures.join(", ") : "None"}

_You can now use this adversary ID to place tokens or modify it further._`,
        },
      ],
    };
  });
}
