import type { z } from "zod";
import type {
  SystemAdapter,
  SystemCreatureIndex,
  SystemMetadata,
} from "../system_types.js";
import {
  type DaggerheartFilters,
  DaggerheartFiltersSchema,
  describeDaggerheartFilters,
  matchesDaggerheartFilters,
} from "./daggerheart_filters.js";

export class DaggerheartSystemAdapter implements SystemAdapter {
  getMetadata(): SystemMetadata {
    return {
      id: "daggerheart",
      name: "daggerheart",
      displayName: "Daggerheart",
      version: "2.5.4",
      description: "System adapter for Daggerheart RPG (Foundry V14)",
      supportedFeatures: {
        creatureIndex: true,
        characterStats: true,
        spellcasting: true,
        powerLevel: true,
      },
    };
  }

  canHandle(systemId: string): boolean {
    const normalized = systemId.toLowerCase();
    return normalized === "daggerheart" || normalized === "dh";
  }

  extractCreatureData(
    doc: Record<string, unknown>,
    pack: Record<string, unknown>,
  ): { creature: SystemCreatureIndex; errors: number } | null {
    try {
      const type = (doc.type as string) || "";
      if (!["adversary", "character", "npc", "creature"].includes(type)) {
        return null;
      }

      const system = (doc.system as Record<string, unknown>) || {};
      const tier =
        typeof system.tier === "number"
          ? system.tier
          : ((system.level as number) ?? 0);
      const adversaryType =
        (system.adversaryType as string) ||
        (system.type as string) ||
        ((system.details as Record<string, unknown>)?.type as string) ||
        "standard";

      const attributes = (system.attributes as Record<string, unknown>) || {};
      const hp =
        system.hp || (system.resources as Record<string, unknown>)?.hp || {};
      const stress =
        system.stress ||
        (system.resources as Record<string, unknown>)?.stress ||
        {};
      const evasion =
        system.evasion ??
        (system.stats as Record<string, unknown>)?.evasion ??
        0;
      const armor =
        system.armor ?? (system.stats as Record<string, unknown>)?.armor ?? 0;

      const creature: SystemCreatureIndex = {
        id: (doc._id as string) || (doc.id as string) || "",
        name: (doc.name as string) || "Unnamed",
        type,
        packName: (pack.name as string) || (pack.id as string) || "",
        packLabel: (pack.label as string) || "",
        img: (doc.img as string) || undefined,
        system: "daggerheart",
        systemData: {
          tier,
          adversaryType,
          attributes,
          hp,
          stress,
          evasion,
          armor,
          experiences: system.experiences || [],
          motives: system.motives || [],
        },
      };

      return { creature, errors: 0 };
    } catch {
      return null;
    }
  }

  getFilterSchema(): z.ZodSchema {
    return DaggerheartFiltersSchema;
  }

  matchesFilters(
    creature: SystemCreatureIndex,
    filters: Record<string, unknown>,
  ): boolean {
    const parsedFilters = DaggerheartFiltersSchema.safeParse(filters);
    if (!parsedFilters.success) return true;
    return matchesDaggerheartFilters(
      creature as { systemData: Record<string, unknown> },
      parsedFilters.data as DaggerheartFilters,
    );
  }

  getDataPaths(): Record<string, string | null> {
    return {
      name: "name",
      hp: "system.resources.hp",
      stress: "system.resources.stress",
      hope: "system.resources.hope",
      evasion: "system.evasion",
      armor: "system.armor",
      tier: "system.tier",
      level: "system.level",
      agility: "system.attributes.agility.value",
      strength: "system.attributes.strength.value",
      finesse: "system.attributes.finesse.value",
      instinct: "system.attributes.instinct.value",
      presence: "system.attributes.presence.value",
      knowledge: "system.attributes.knowledge.value",
    };
  }

  formatCreatureForList(
    creature: SystemCreatureIndex,
  ): Record<string, unknown> {
    const data = creature.systemData;
    return {
      id: creature.id,
      name: creature.name,
      type: creature.type,
      tier: data.tier,
      adversaryType: data.adversaryType,
      evasion: data.evasion,
      armor: data.armor,
      pack: creature.packLabel || creature.packName,
    };
  }

  formatCreatureForDetails(
    creature: SystemCreatureIndex,
  ): Record<string, unknown> {
    const data = creature.systemData;
    return {
      id: creature.id,
      name: creature.name,
      type: creature.type,
      img: creature.img,
      tier: data.tier,
      adversaryType: data.adversaryType,
      attributes: data.attributes,
      hp: data.hp,
      stress: data.stress,
      evasion: data.evasion,
      armor: data.armor,
      experiences: data.experiences,
      motives: data.motives,
      pack: creature.packLabel || creature.packName,
    };
  }

  describeFilters(filters: Record<string, unknown>): string {
    const parsed = DaggerheartFiltersSchema.safeParse(filters);
    if (!parsed.success) return "invalid filters";
    return describeDaggerheartFilters(parsed.data as DaggerheartFilters);
  }

  getPowerLevel(creature: SystemCreatureIndex): number | undefined {
    const tier = creature.systemData?.tier;
    return typeof tier === "number" ? tier : undefined;
  }

  extractCharacterStats(
    actorData: Record<string, unknown>,
  ): Record<string, unknown> {
    const system = (actorData.system as Record<string, unknown>) || {};
    const attributes = (system.attributes as Record<string, unknown>) || {};
    const resources = (system.resources as Record<string, unknown>) || {};

    return {
      name: actorData.name,
      type: actorData.type,
      level: system.level ?? system.tier ?? 1,
      attributes: {
        agility: (attributes.agility as Record<string, unknown>)?.value ?? 0,
        strength: (attributes.strength as Record<string, unknown>)?.value ?? 0,
        finesse: (attributes.finesse as Record<string, unknown>)?.value ?? 0,
        instinct: (attributes.instinct as Record<string, unknown>)?.value ?? 0,
        presence: (attributes.presence as Record<string, unknown>)?.value ?? 0,
        knowledge:
          (attributes.knowledge as Record<string, unknown>)?.value ?? 0,
      },
      hp: resources.hp ?? system.hp ?? { value: 0, max: 0 },
      stress: resources.stress ?? system.stress ?? { value: 0, max: 0 },
      hope: resources.hope ?? { value: 0, max: 6 },
      evasion:
        system.evasion ??
        (system.stats as Record<string, unknown>)?.evasion ??
        0,
      armor:
        system.armor ?? (system.stats as Record<string, unknown>)?.armor ?? 0,
    };
  }

  extractBasicInfo(
    actorData: Record<string, unknown>,
  ): Record<string, unknown> {
    return this.extractCharacterStats(actorData);
  }

  getSchemaNotes(): string {
    return `Daggerheart Actor Schema:
- Attributes: Agility, Strength, Finesse, Instinct, Presence, Knowledge.
- Core Resources: HP, Stress, Hope (PC), Fear (GM).
- Defenses: Evasion, Armor Slots.
- Adversaries use Tier (0-4) and Type (minion, standard, leader, solo, horde, social).`;
  }
}
