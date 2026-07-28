import type { z } from "zod";

/**
 * Supported game system identifiers.
 */
export type SystemId = "daggerheart" | "dnd5e" | "pf2e" | "other";

/**
 * System metadata returned by adapters.
 */
export interface SystemMetadata {
  id: SystemId;
  name: string;
  displayName: string;
  version: string;
  description: string;
  supportedFeatures: {
    creatureIndex: boolean;
    characterStats: boolean;
    spellcasting: boolean;
    powerLevel: boolean;
  };
}

/**
 * Common structure for indexed creature data across game systems.
 */
export interface SystemCreatureIndex {
  id: string;
  name: string;
  type: string;
  packName: string;
  packLabel: string;
  img?: string;
  system: SystemId;
  systemData: Record<string, unknown>;
}

/**
 * System Adapter Interface for system-specific actor/creature operations.
 */
export interface SystemAdapter {
  getMetadata(): SystemMetadata;
  canHandle(systemId: string): boolean;
  extractCreatureData(
    doc: Record<string, unknown>,
    pack: Record<string, unknown>,
  ): { creature: SystemCreatureIndex; errors: number } | null;
  getFilterSchema(): z.ZodSchema;
  matchesFilters(
    creature: SystemCreatureIndex,
    filters: Record<string, unknown>,
  ): boolean;
  getDataPaths(): Record<string, string | null>;
  formatCreatureForList(creature: SystemCreatureIndex): Record<string, unknown>;
  formatCreatureForDetails(
    creature: SystemCreatureIndex,
  ): Record<string, unknown>;
  describeFilters(filters: Record<string, unknown>): string;
  getPowerLevel(creature: SystemCreatureIndex): number | undefined;
  extractCharacterStats(
    actorData: Record<string, unknown>,
  ): Record<string, unknown>;
  extractBasicInfo?(
    actorData: Record<string, unknown>,
  ): Record<string, unknown>;
  getSchemaNotes?(): string;
}

/**
 * Interface for building enhanced creature indexes from compendiums.
 */
export interface IndexBuilder {
  getSystemId(): SystemId;
  buildIndex(
    packs: Record<string, unknown>[],
    force?: boolean,
  ): Promise<SystemCreatureIndex[]>;
}
