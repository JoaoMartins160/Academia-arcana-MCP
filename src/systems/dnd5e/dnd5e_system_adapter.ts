import { z } from "zod";
import type {
  SystemAdapter,
  SystemCreatureIndex,
  SystemMetadata,
} from "../system_types.js";

export const Dnd5eFiltersSchema = z.object({
  cr: z.number().optional(),
  minCr: z.number().optional(),
  maxCr: z.number().optional(),
  type: z.string().optional(),
});

export type Dnd5eFilters = z.infer<typeof Dnd5eFiltersSchema>;

export class Dnd5eSystemAdapter implements SystemAdapter {
  getMetadata(): SystemMetadata {
    return {
      id: "dnd5e",
      name: "dnd5e",
      displayName: "D&D 5th Edition",
      version: "4.0.0",
      description: "System adapter for Dungeons & Dragons 5e (Foundry V14)",
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
    return normalized === "dnd5e" || normalized === "5e";
  }

  extractCreatureData(
    doc: Record<string, unknown>,
    pack: Record<string, unknown>,
  ): { creature: SystemCreatureIndex; errors: number } | null {
    try {
      const type = (doc.type as string) || "";
      if (!["npc", "character", "vehicle"].includes(type)) {
        return null;
      }

      const system = (doc.system as Record<string, unknown>) || {};
      const details = (system.details as Record<string, unknown>) || {};
      const cr =
        typeof details.cr === "number"
          ? details.cr
          : ((system.level as number) ?? 0);

      const attributes = (system.attributes as Record<string, unknown>) || {};
      const hp = attributes.hp || {};
      const ac = attributes.ac || {};

      const creature: SystemCreatureIndex = {
        id: (doc._id as string) || (doc.id as string) || "",
        name: (doc.name as string) || "Unnamed",
        type,
        packName: (pack.name as string) || (pack.id as string) || "",
        packLabel: (pack.label as string) || "",
        img: (doc.img as string) || undefined,
        system: "dnd5e",
        systemData: {
          cr,
          hp,
          ac,
          abilities: system.abilities || {},
          spells: system.spells || {},
        },
      };

      return { creature, errors: 0 };
    } catch {
      return null;
    }
  }

  getFilterSchema(): z.ZodSchema {
    return Dnd5eFiltersSchema;
  }

  matchesFilters(
    creature: SystemCreatureIndex,
    filters: Record<string, unknown>,
  ): boolean {
    const data = creature.systemData;
    const cr = typeof data.cr === "number" ? data.cr : 0;

    if (
      typeof filters.cr === "number" &&
      Math.abs(cr - (filters.cr as number)) > 0.01
    ) {
      return false;
    }
    if (typeof filters.minCr === "number" && cr < (filters.minCr as number)) {
      return false;
    }
    if (typeof filters.maxCr === "number" && cr > (filters.maxCr as number)) {
      return false;
    }
    if (typeof filters.type === "string" && creature.type !== filters.type) {
      return false;
    }
    return true;
  }

  getDataPaths(): Record<string, string | null> {
    return {
      hp: "system.attributes.hp.value",
      hpMax: "system.attributes.hp.max",
      ac: "system.attributes.ac.value",
      cr: "system.details.cr",
    };
  }

  formatCreatureForList(
    creature: SystemCreatureIndex,
  ): Record<string, unknown> {
    return {
      id: creature.id,
      name: creature.name,
      type: creature.type,
      cr: creature.systemData.cr,
      pack: creature.packLabel,
    };
  }

  formatCreatureForDetails(
    creature: SystemCreatureIndex,
  ): Record<string, unknown> {
    return {
      id: creature.id,
      name: creature.name,
      type: creature.type,
      pack: creature.packLabel,
      cr: creature.systemData.cr,
      hp: creature.systemData.hp,
      ac: creature.systemData.ac,
      abilities: creature.systemData.abilities,
    };
  }

  describeFilters(filters: Record<string, unknown>): string {
    const parts: string[] = [];
    if (filters.cr !== undefined) parts.push(`CR ${filters.cr}`);
    if (filters.minCr !== undefined) parts.push(`Min CR ${filters.minCr}`);
    if (filters.maxCr !== undefined) parts.push(`Max CR ${filters.maxCr}`);
    return parts.length > 0 ? parts.join(", ") : "No filters applied";
  }

  getPowerLevel(creature: SystemCreatureIndex): number | undefined {
    return typeof creature.systemData.cr === "number"
      ? (creature.systemData.cr as number)
      : undefined;
  }

  extractCharacterStats(
    actorData: Record<string, unknown>,
  ): Record<string, unknown> {
    const system = (actorData.system as Record<string, unknown>) || {};
    const attributes = (system.attributes as Record<string, unknown>) || {};
    return {
      level: (system.details as Record<string, unknown>)?.level ?? 1,
      hp: attributes.hp,
      ac: attributes.ac,
      abilities: system.abilities,
    };
  }

  getSchemaNotes(): string {
    return "D&D 5e character and NPC schema using system.attributes and system.abilities.";
  }
}
