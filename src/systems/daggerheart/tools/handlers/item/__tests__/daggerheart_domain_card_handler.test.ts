import { describe, expect, it, vi } from "vitest";
import type { FoundryClient } from "../../../../../../foundry/client.js";
import { handleManageDaggerheartDomainCards } from "../daggerheart_domain_card_handler.js";

describe("handleManageDaggerheartDomainCards", () => {
  it("should create and equip a domain card on an actor", async () => {
    const mockClient = {
      getRawActor: vi.fn().mockReturnValue({
        name: "Sylas",
        system: {},
      }),
      createActorItem: vi.fn().mockResolvedValue({
        _id: "item999",
        name: "Arcane Sense",
      }),
    } as unknown as FoundryClient;

    const result = await handleManageDaggerheartDomainCards(
      {
        actorId: "act101",
        name: "Arcane Sense",
        domain: "Arcana",
        level: 2,
        hopeCost: 1,
        vaulted: false,
      },
      mockClient,
    );

    expect(mockClient.createActorItem).toHaveBeenCalledWith("act101", {
      type: "inline",
      item: {
        name: "Arcane Sense",
        type: "domainCard",
        system: {
          domain: "Arcana",
          level: 2,
          hopeCost: 1,
          recallCost: 0,
          description: "",
          vaulted: false,
        },
      },
    });
    expect(result.content[0].text).toContain("Arcane Sense");
    expect(result.content[0].text).toContain("EQUIPPED");
  });

  it("should throw error if actor is not found", async () => {
    const mockClient = {
      getRawActor: vi.fn().mockReturnValue(null),
    } as unknown as FoundryClient;

    await expect(
      handleManageDaggerheartDomainCards(
        { actorId: "invalid", name: "Card", domain: "Blade" },
        mockClient,
      ),
    ).rejects.toThrow();
  });
});
