import { logger } from "../utils/logger.js";
import type { IndexBuilder, SystemId } from "./system_types.js";

/**
 * Registry for managing compendium index builders for supported game systems.
 */
export class IndexBuilderRegistry {
  private builders: Map<SystemId, IndexBuilder> = new Map();

  /**
   * Register an IndexBuilder instance.
   */
  register(builder: IndexBuilder): void {
    const systemId = builder.getSystemId();
    if (this.builders.has(systemId)) {
      logger.warn(
        `[IndexBuilderRegistry] Builder for '${systemId}' already registered. Overwriting.`,
      );
    }
    this.builders.set(systemId, builder);
    logger.info(
      `[IndexBuilderRegistry] Registered IndexBuilder for system: ${systemId}`,
    );
  }

  /**
   * Retrieve IndexBuilder for a system.
   */
  getBuilder(systemId: string): IndexBuilder | null {
    const builder = this.builders.get(systemId as SystemId);
    if (!builder) {
      logger.warn(
        `[IndexBuilderRegistry] No builder found for system: ${systemId}`,
      );
      return null;
    }
    return builder;
  }

  /**
   * Clear all registered builders.
   */
  clear(): void {
    this.builders.clear();
    logger.debug("[IndexBuilderRegistry] Cleared all index builders");
  }
}

let builderRegistryInstance: IndexBuilderRegistry | null = null;

/**
 * Get global IndexBuilderRegistry instance.
 */
export function getIndexBuilderRegistry(): IndexBuilderRegistry {
  if (!builderRegistryInstance) {
    builderRegistryInstance = new IndexBuilderRegistry();
  }
  return builderRegistryInstance;
}

/**
 * Reset global IndexBuilderRegistry instance.
 */
export function resetIndexBuilderRegistry(): void {
  if (builderRegistryInstance) {
    builderRegistryInstance.clear();
  }
  builderRegistryInstance = null;
}
