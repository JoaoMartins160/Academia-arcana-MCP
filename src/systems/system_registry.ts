import { logger } from "../utils/logger.js";
import type { SystemAdapter, SystemId } from "./system_types.js";

/**
 * Central registry for managing game system adapters.
 * Allows dynamic registration of system adapters without editing core files.
 */
export class SystemRegistry {
  private adapters: Map<SystemId, SystemAdapter> = new Map();

  /**
   * Register a system adapter.
   */
  register(adapter: SystemAdapter): void {
    const metadata = adapter.getMetadata();
    if (this.adapters.has(metadata.id)) {
      logger.warn(
        `[SystemRegistry] Adapter for '${metadata.id}' already registered. Overwriting.`,
      );
    }
    this.adapters.set(metadata.id, adapter);
    logger.info(
      `[SystemRegistry] Registered system adapter: ${metadata.displayName} (${metadata.id})`,
    );
  }

  /**
   * Look up system adapter by system ID or alias matching.
   */
  getAdapter(systemId: string): SystemAdapter | null {
    const exactMatch = this.adapters.get(systemId as SystemId);
    if (exactMatch) {
      return exactMatch;
    }

    for (const adapter of this.adapters.values()) {
      if (adapter.canHandle(systemId)) {
        return adapter;
      }
    }

    logger.warn(`[SystemRegistry] No adapter found for system: ${systemId}`);
    return null;
  }

  /**
   * Get all registered system adapters.
   */
  getAllAdapters(): SystemAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Check if a system ID is supported.
   */
  isSupported(systemId: string): boolean {
    return this.getAdapter(systemId) !== null;
  }

  /**
   * Get list of supported system IDs.
   */
  getSupportedSystems(): SystemId[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Clear registered adapters (useful for testing).
   */
  clear(): void {
    this.adapters.clear();
    logger.debug("[SystemRegistry] Cleared all system adapters");
  }
}

let registryInstance: SystemRegistry | null = null;

/**
 * Get the global SystemRegistry instance.
 */
export function getSystemRegistry(): SystemRegistry {
  if (!registryInstance) {
    registryInstance = new SystemRegistry();
  }
  return registryInstance;
}

/**
 * Reset the global SystemRegistry instance (for testing).
 */
export function resetSystemRegistry(): void {
  if (registryInstance) {
    registryInstance.clear();
  }
  registryInstance = null;
}
