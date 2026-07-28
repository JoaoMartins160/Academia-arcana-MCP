# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-07-28

### Added
- **Daggerheart System Adapter & Registry**: Extensible multi-system architecture (`SystemRegistry`, `DaggerheartSystemAdapter`, `DaggerheartIndexBuilder`).
- **Clean Architecture & System Reorganization**:
  - Isolated game-system-specific MCP tools into `src/systems/<system>/tools/`.
  - System-agnostic Foundry VTT Core tools maintained in `src/tools/`.
  - Created standalone D&D 5e system module in `src/systems/dnd5e/` with migrated character and combat managers.
- **Narrative & Campaign Tools**:
  - `daggerheart_create_quest_journal`: Automated creation of structured Quest Journal entries.
  - `daggerheart_create_campaign_dashboard`: Comprehensive campaign dashboard generator with Hope tracker and Act structures.
  - `daggerheart_create_adversary_spec`: Complete specification and actor builder for Daggerheart adversaries (Tier 0-4).
- **Tactical Combat & Mechanics**:
  - `daggerheart_get_combat_tactical_context`: Tactical view with distance mapping into Daggerheart Range Bands (*Melee, Very Close, Close, Far, Very Far*) and ASCII grid map.
  - `daggerheart_roll_duality_extended`: Extended 2d12 Duality roll (Hope vs Fear) with Advantage/Disadvantage (+1d6/-1d6) and Duality Match Critical.
  - `daggerheart_modify_combat_resources`: Real-time modification of HP, Stress, Hope, Fear, Armor Slots, and status conditions.
  - `daggerheart_apply_damage_with_thresholds`: Automated calculation of damage against Minor/Major/Severe thresholds and Armor Slots.
  - `daggerheart_manage_action_tracker`: Track and mutate Action Tokens / Action Tracker for dynamic turn-less combat.
  - `daggerheart_create_character`: Full PC creation pipeline with Ancestry, Community, Class, Traits, and starting Domain Cards.
  - `daggerheart_invoke_experience`: Invocation of character Experiences (+1 / +2) on Duality Rolls.
  - `daggerheart_search_compendium`: Advanced search across Daggerheart compendiums by level, tier, class, domain, and rarity.
- **Action Graphs & Pipelines**:
  - `daggerheart_execute_action_graph`: Execution of multi-step action graphs with variable resolution across node steps.
  - `daggerheart_pipeline_encounter_setup`: Macro pipeline for automated encounter setup (Adversary + Scene + Quest Journal).
  - `daggerheart_pipeline_full_character_onboarding`: Macro pipeline for character creation + domain card assignment + resource initialization.
- **Domain Cards & World Tools**:
  - `daggerheart_manage_domain_cards`: Addition, equipment, and vault management of Domain Cards.
  - `daggerheart_roll_table`: Roll execution on native Daggerheart RollTables.
  - `daggerheart_manage_scene_environment`: Scene activation, atmospheric darkness control, and GM map notes.
- **Validation & Typing**: Dedicated `schemas/` subdirectories with Zod parsing for all Daggerheart domain handlers.

## [1.0.0] - 2026-07-27

### Added
- Initial release of Academia-Arcana-MCP (FoundryVTT Model Context Protocol Server).
- Complete tool registry for FoundryVTT integration (Actors, Items, Scenes, Journals, Combat, Chat, Generation, Diagnostics).
- Gitflow workflow configuration and automated Husky pre-commit, commit-msg, and pre-push hooks.
