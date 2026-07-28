import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { FoundryClient } from "../../../foundry/client.js";

// Import Daggerheart specific handlers
import { handleCreateDaggerheartCharacter } from "./handlers/actor/daggerheart_character_builder_handler.js";
import { handleManageDaggerheartActionTracker } from "./handlers/combat/daggerheart_action_tracker_handler.js";
import { handleApplyDaggerheartDamageWithThresholds } from "./handlers/combat/daggerheart_damage_threshold_handler.js";
import { handleModifyDaggerheartCombatResources } from "./handlers/combat/daggerheart_resource_mutation_handler.js";
import { handleGetDaggerheartCombatTacticalContext } from "./handlers/combat/daggerheart_tactical_combat_context_handler.js";
import { handleSearchDaggerheartCompendium } from "./handlers/compendium/daggerheart_compendium_search_handler.js";
import { handleRollDaggerheartDualityExtended } from "./handlers/dice/daggerheart_duality_roll_handler.js";
import { handleInvokeDaggerheartExperience } from "./handlers/dice/daggerheart_experience_invocation_handler.js";
import {
  type DaggerheartAdversarySpecArgs,
  handleCreateDaggerheartAdversarySpec,
} from "./handlers/generation/daggerheart_adversary_spec_creator.js";
import { handleManageDaggerheartDomainCards } from "./handlers/item/daggerheart_domain_card_handler.js";
import { handleCreateDaggerheartCampaignDashboard } from "./handlers/journal/daggerheart_campaign_dashboard_handler.js";
import { handleCreateDaggerheartQuestJournal } from "./handlers/journal/daggerheart_quest_journal_handler.js";
import { handleManageDaggerheartSceneEnvironment } from "./handlers/scene/daggerheart_scene_management_handler.js";
import { handleExecuteDaggerheartActionGraph } from "./handlers/workflow/daggerheart_action_graph_handler.js";
import {
  handlePipelineEncounterSetup,
  handlePipelineFullCharacterOnboarding,
} from "./handlers/workflow/daggerheart_pipeline_macro_handler.js";
import { handleRollDaggerheartTable } from "./handlers/world/daggerheart_roll_table_handler.js";

/**
 * Route Daggerheart specific tool requests to their dedicated handlers.
 */
export async function routeDaggerheartToolRequest(
  name: string,
  args: unknown,
  foundryClient: FoundryClient,
) {
  switch (name) {
    case "daggerheart_create_quest_journal":
      return handleCreateDaggerheartQuestJournal(args, foundryClient);
    case "daggerheart_create_campaign_dashboard":
      return handleCreateDaggerheartCampaignDashboard(args, foundryClient);
    case "daggerheart_create_adversary_spec":
      return handleCreateDaggerheartAdversarySpec(
        args as unknown as DaggerheartAdversarySpecArgs,
        foundryClient,
      );
    case "daggerheart_get_combat_tactical_context":
      return handleGetDaggerheartCombatTacticalContext(args, foundryClient);
    case "daggerheart_roll_duality_extended":
      return handleRollDaggerheartDualityExtended(args);
    case "daggerheart_modify_combat_resources":
      return handleModifyDaggerheartCombatResources(args, foundryClient);
    case "daggerheart_manage_domain_cards":
      return handleManageDaggerheartDomainCards(args, foundryClient);
    case "daggerheart_roll_table":
      return handleRollDaggerheartTable(args, foundryClient);
    case "daggerheart_manage_scene_environment":
      return handleManageDaggerheartSceneEnvironment(args, foundryClient);
    case "daggerheart_apply_damage_with_thresholds":
      return handleApplyDaggerheartDamageWithThresholds(args, foundryClient);
    case "daggerheart_manage_action_tracker":
      return handleManageDaggerheartActionTracker(args, foundryClient);
    case "daggerheart_create_character":
      return handleCreateDaggerheartCharacter(args, foundryClient);
    case "daggerheart_invoke_experience":
      return handleInvokeDaggerheartExperience(args, foundryClient);
    case "daggerheart_search_compendium":
      return handleSearchDaggerheartCompendium(args, foundryClient);
    case "daggerheart_execute_action_graph":
      return handleExecuteDaggerheartActionGraph(args, foundryClient);
    case "daggerheart_pipeline_encounter_setup":
      return handlePipelineEncounterSetup(
        args as Record<string, unknown>,
        foundryClient,
      );
    case "daggerheart_pipeline_full_character_onboarding":
      return handlePipelineFullCharacterOnboarding(
        args as Record<string, unknown>,
        foundryClient,
      );
    default:
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown Daggerheart tool: ${name}`,
      );
  }
}
