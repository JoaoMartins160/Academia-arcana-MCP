import { describe, expect, it } from "vitest";
import {
  describeDaggerheartFilters,
  matchesDaggerheartFilters,
} from "../daggerheart/daggerheart_filters.js";
import { DaggerheartSystemAdapter } from "../daggerheart/daggerheart_system_adapter.js";

describe("DaggerheartSystemAdapter", () => {
  const adapter = new DaggerheartSystemAdapter();

  it("should return correct metadata", () => {
    const meta = adapter.getMetadata();
    expect(meta.id).toBe("daggerheart");
    expect(meta.displayName).toBe("Daggerheart");
    expect(meta.supportedFeatures.creatureIndex).toBe(true);
  });

  it("should handle system aliases", () => {
    expect(adapter.canHandle("daggerheart")).toBe(true);
    expect(adapter.canHandle("DAGGERHEART")).toBe(true);
    expect(adapter.canHandle("dh")).toBe(true);
    expect(adapter.canHandle("dnd5e")).toBe(false);
  });

  it("should extract creature data from adversary actor doc", () => {
    const doc = {
      _id: "adv123",
      name: "Forest Goblin",
      type: "adversary",
      img: "icons/goblin.webp",
      system: {
        tier: 1,
        type: "minion",
        attributes: {
          agility: { value: 2 },
          strength: { value: -1 },
        },
        resources: {
          hp: { value: 5, max: 5 },
          stress: { value: 0, max: 3 },
        },
        evasion: 11,
        armor: 1,
        experiences: ["Ambush Specialist"],
        motives: ["Steal shiny trinkets"],
      },
    };

    const pack = { name: "adversaries", label: "Adversaries Compendium" };
    const extracted = adapter.extractCreatureData(doc, pack);

    expect(extracted).not.toBeNull();
    expect(extracted?.creature.name).toBe("Forest Goblin");
    expect(extracted?.creature.systemData.tier).toBe(1);
    expect(extracted?.creature.systemData.adversaryType).toBe("minion");
  });

  it("should match filters correctly", () => {
    const creature = {
      systemData: {
        name: "Forest Goblin",
        tier: 1,
        adversaryType: "minion",
        size: "small",
        experiences: ["Ambush"],
      },
    };

    expect(matchesDaggerheartFilters(creature, { tier: 1 })).toBe(true);
    expect(matchesDaggerheartFilters(creature, { tier: 2 })).toBe(false);
    expect(
      matchesDaggerheartFilters(creature, { adversaryType: "minion" }),
    ).toBe(true);
    expect(matchesDaggerheartFilters(creature, { adversaryType: "solo" })).toBe(
      false,
    );
    expect(matchesDaggerheartFilters(creature, { hasExperiences: true })).toBe(
      true,
    );
  });

  it("should generate filter descriptions", () => {
    const desc = describeDaggerheartFilters({
      tier: { min: 1, max: 3 },
      adversaryType: "solo",
    });
    expect(desc).toContain("Tier 1-3");
    expect(desc).toContain("Type: solo");
  });

  it("should extract character stats", () => {
    const actorData = {
      name: "Valerius",
      type: "character",
      system: {
        level: 3,
        attributes: {
          agility: { value: 2 },
          strength: { value: 1 },
          finesse: { value: 0 },
          instinct: { value: -1 },
          presence: { value: 2 },
          knowledge: { value: 1 },
        },
        resources: {
          hp: { value: 12, max: 12 },
          stress: { value: 1, max: 6 },
          hope: { value: 4, max: 6 },
        },
        evasion: 13,
        armor: 2,
      },
    };

    const stats = adapter.extractCharacterStats(actorData);
    expect(stats.name).toBe("Valerius");
    expect(stats.level).toBe(3);
    expect((stats.attributes as Record<string, number>).agility).toBe(2);
    expect((stats.hope as Record<string, number>).value).toBe(4);
  });
});
