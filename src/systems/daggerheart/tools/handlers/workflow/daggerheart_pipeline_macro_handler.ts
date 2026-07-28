import type { FoundryClient } from "../../../../../foundry/client.js";
import { withToolError } from "../../../../../tools/handlers/utils.js";
import { handleExecuteDaggerheartActionGraph } from "./daggerheart_action_graph_handler.js";

export async function handlePipelineEncounterSetup(
  args: Record<string, unknown>,
  foundryClient: FoundryClient,
) {
  return withToolError("pipeline encounter setup", async () => {
    const encounterName = (args.encounterName as string) || "Goblin Ambush";
    const adversaryName = (args.adversaryName as string) || "Goblin Leader";
    const sceneName = (args.sceneName as string) || "Forest Clearing";

    const graphPayload = {
      graphName: `Encounter Setup: ${encounterName}`,
      stopOnError: false,
      nodes: [
        {
          id: "create_adversary",
          toolName: "daggerheart_create_adversary_spec",
          args: {
            name: adversaryName,
            tier: 1,
            adversaryType: "leader",
            hp: 8,
            evasion: 11,
          },
        },
        {
          id: "setup_scene",
          toolName: "daggerheart_manage_scene_environment",
          args: {
            sceneNameOrId: sceneName,
            activate: true,
            darkness: 0.5,
            noteTitle: `Encounter: ${encounterName}`,
            noteContent: "Adversaries placed and environment ready.",
          },
        },
        {
          id: "create_quest",
          toolName: "daggerheart_create_quest_journal",
          args: {
            questTitle: encounterName,
            summary: "Survive and defeat the ambush forces.",
            questType: "side",
            difficulty: "medium",
            objectives: ["Defeat the adversary leader", "Secure the perimeter"],
          },
        },
        {
          id: "get_tactical_context",
          toolName: "daggerheart_get_combat_tactical_context",
          args: {
            zoomRadius: 15,
          },
        },
      ],
    };

    return handleExecuteDaggerheartActionGraph(graphPayload, foundryClient);
  });
}

export async function handlePipelineFullCharacterOnboarding(
  args: Record<string, unknown>,
  foundryClient: FoundryClient,
) {
  return withToolError("pipeline full character onboarding", async () => {
    const name = (args.name as string) || "Valerius";
    const ancestry = (args.ancestry as string) || "Elf";
    const community = (args.community as string) || "Ridgeborne";
    const className = (args.className as string) || "Wizard";
    const domain = (args.domain as string) || "Arcana";

    const graphPayload = {
      graphName: `Character Onboarding: ${name}`,
      stopOnError: false,
      nodes: [
        {
          id: "create_character",
          toolName: "daggerheart_create_character",
          args: {
            name,
            ancestry,
            community,
            className,
            hp: 12,
            stress: 5,
            evasion: 10,
            armor: 2,
          },
        },
        {
          id: "add_domain_card",
          toolName: "daggerheart_manage_domain_cards",
          args: {
            actorId: "pc101",
            name: `${domain} Mastery`,
            domain,
            level: 1,
            vaulted: false,
          },
        },
        {
          id: "init_resources",
          toolName: "daggerheart_modify_combat_resources",
          args: {
            actorId: "pc101",
            hopeDelta: 2,
          },
        },
      ],
    };

    return handleExecuteDaggerheartActionGraph(graphPayload, foundryClient);
  });
}
