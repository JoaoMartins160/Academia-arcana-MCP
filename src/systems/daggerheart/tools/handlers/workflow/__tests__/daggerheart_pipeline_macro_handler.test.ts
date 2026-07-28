import { describe, expect, it, vi } from "vitest";
import type { FoundryClient } from "../../../../../../foundry/client.js";
import {
  handlePipelineEncounterSetup,
  handlePipelineFullCharacterOnboarding,
} from "../daggerheart_pipeline_macro_handler.js";

describe("handlePipelineEncounterSetup", () => {
  it("should execute encounter setup macro pipeline", async () => {
    const mockClient = {
      createActor: vi
        .fn()
        .mockResolvedValue({ _id: "adv123", name: "Goblin King" }),
      getScenes: vi
        .fn()
        .mockResolvedValue([{ _id: "sc1", name: "Dark Clearing" }]),
      createJournal: vi.fn().mockResolvedValue({ _id: "j99", name: "Ambush" }),
      getCombatState: vi.fn().mockResolvedValue(null),
    } as unknown as FoundryClient;

    const result = await handlePipelineEncounterSetup(
      {
        encounterName: "Goblin Ambush",
        adversaryName: "Goblin King",
        sceneName: "Dark Clearing",
      },
      mockClient,
    );

    const text = result.content[0].text;
    expect(text).toContain("Encounter Setup: Goblin Ambush");
    expect(text).toContain("create_adversary");
    expect(text).toContain("setup_scene");
    expect(text).toContain("create_quest");
  });
});

describe("handlePipelineFullCharacterOnboarding", () => {
  it("should execute full character onboarding macro pipeline", async () => {
    const mockClient = {
      createActor: vi.fn().mockResolvedValue({ _id: "pc101", name: "Theron" }),
      getRawActor: vi.fn().mockReturnValue({
        name: "Theron",
        system: { resources: { hope: { value: 0 } } },
      }),
      createActorItem: vi
        .fn()
        .mockResolvedValue({ _id: "card101", name: "Arcana Mastery" }),
      updateActorAttribute: vi.fn().mockResolvedValue({ success: true }),
    } as unknown as FoundryClient;

    const result = await handlePipelineFullCharacterOnboarding(
      {
        name: "Theron",
        ancestry: "Elf",
        community: "Ridgeborne",
        className: "Wizard",
        domain: "Arcana",
      },
      mockClient,
    );

    const text = result.content[0].text;
    expect(text).toContain("Character Onboarding: Theron");
    expect(text).toContain("create_character");
    expect(text).toContain("add_domain_card");
    expect(text).toContain("init_resources");
  });
});
