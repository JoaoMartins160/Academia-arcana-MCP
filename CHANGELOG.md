# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-07-28

### Added
- **Daggerheart System Adapter & Registry**: Extensible multi-system architecture (`SystemRegistry`, `DaggerheartSystemAdapter`, `DaggerheartIndexBuilder`).
- **Narrative & Campaign Tools**:
  - `daggerheart_create_quest_journal`: Automated creation of structured Quest Journal entries.
  - `daggerheart_create_campaign_dashboard`: Comprehensive campaign dashboard generator with Hope tracker and Act structures.
  - `daggerheart_create_adversary_spec`: Complete specification and actor builder for Daggerheart adversaries (Tier 0-4).
- **Tactical Combat & Abstract Ranges**:
  - `daggerheart_get_combat_tactical_context`: Tactical view with distance mapping into Daggerheart Range Bands (*Melee, Very Close, Close, Far, Very Far*) and ASCII grid map.
  - `daggerheart_roll_duality_extended`: Extended 2d12 Duality roll (Hope vs Fear) with Advantage/Disadvantage (+1d6/-1d6) and Duality Match Critical.
  - `daggerheart_modify_combat_resources`: Real-time modification of HP, Stress, Hope, Fear, Armor Slots, and status conditions.
- **Domain Cards & World Tools**:
  - `daggerheart_manage_domain_cards`: Addition, equipment, and vault management of Domain Cards (Arcana, Blade, Bone, Codex, Grace, Midnight, Sage, Splendor, Valor).
  - `daggerheart_roll_table`: Roll execution on native Daggerheart RollTables.
  - `daggerheart_manage_scene_environment`: Scene activation, atmospheric darkness control, and GM map notes.
- **Validation & Typing**: Dedicated `schemas/` subdirectories with Zod parsing for all Daggerheart domain handlers.

## [1.0.0] - 2026-07-27

### Added
- Initial release of Academia-Arcana-MCP (FoundryVTT Model Context Protocol Server).
- Complete tool registry for FoundryVTT integration (Actors, Items, Scenes, Journals, Combat, Chat, Generation, Diagnostics).
- Gitflow workflow configuration and automated Husky pre-commit, commit-msg, and pre-push hooks.
