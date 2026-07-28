import { logger } from "../utils/logger.js";
import { getIndexBuilderRegistry } from "./compendium_index_builder_registry.js";
import { DaggerheartIndexBuilder } from "./daggerheart/daggerheart_compendium_index_builder.js";
import { DaggerheartSystemAdapter } from "./daggerheart/daggerheart_system_adapter.js";
import { getSystemRegistry } from "./system_registry.js";

export * from "./system_types.js";
export * from "./system_registry.js";
export * from "./compendium_index_builder_registry.js";
export * from "./daggerheart/daggerheart_system_adapter.js";
export * from "./daggerheart/daggerheart_filters.js";
export * from "./daggerheart/daggerheart_compendium_index_builder.js";

/**
 * Initialize and register default system adapters (e.g. Daggerheart).
 */
export function initializeSystemRegistry(): void {
  const systemRegistry = getSystemRegistry();
  const indexBuilderRegistry = getIndexBuilderRegistry();

  const daggerheartAdapter = new DaggerheartSystemAdapter();
  const daggerheartBuilder = new DaggerheartIndexBuilder();

  systemRegistry.register(daggerheartAdapter);
  indexBuilderRegistry.register(daggerheartBuilder);

  logger.info(
    "[Systems] Initialized system registry with Daggerheart adapter.",
  );
}
