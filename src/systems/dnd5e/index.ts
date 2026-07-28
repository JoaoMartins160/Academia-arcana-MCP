/**
 * D&D 5e system module entrypoint
 *
 * Exports the system adapter, managers, and index builder for D&D 5e (dnd5e).
 * These classes provide the foundation for future D&D 5e support within the
 * Academia-arcana-MCP server.
 *
 * Current scope: passive module (not yet registered in the main system registry).
 * To activate, register Dnd5eSystemAdapter and Dnd5eIndexBuilder in
 * src/systems/system_registry_initializer.ts.
 */

export {
  Dnd5eSystemAdapter,
  Dnd5eFiltersSchema,
} from "./dnd5e_system_adapter.js";
export type { Dnd5eFilters } from "./dnd5e_system_adapter.js";
export { Dnd5eIndexBuilder } from "./dnd5e_compendium_index_builder.js";
export { Dnd5eCharacterManager } from "./dnd5e_character_manager.js";
export type {
  CharacterAdvancement,
  EquipmentTransaction,
  ResourceManagement,
  PartyComposition,
} from "./dnd5e_character_manager.js";
export { Dnd5eCombatManager } from "./dnd5e_combat_manager.js";
export type {
  CombatState,
  CombatantState,
  CombatEvent,
} from "./dnd5e_combat_manager.js";
