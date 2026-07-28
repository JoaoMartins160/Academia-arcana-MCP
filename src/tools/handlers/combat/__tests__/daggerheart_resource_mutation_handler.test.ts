import { describe, expect, it, vi } from "vitest";
import type { FoundryClient } from "../../../../foundry/client.js";
import { handleModifyDaggerheartCombatResources } from "../daggerheart_resource_mutation_handler.js";

describe("handleModifyDaggerheartCombatResources", () => {
  it("should modify HP and Stress and call updateActorAttribute", async () => {
    const mockClient = {
      getRawActor: vi.fn().mockReturnValue({
        name: "Forest Goblin",
        system: {
          resources: {
            hp: { value: 5 },
            stress: { value: 1 },
          },
        },
      }),
      updateActorAttribute: vi.fn().mockResolvedValue({ success: true }),
    } as unknown as FoundryClient;

    const result = await handleModifyDaggerheartCombatResources(
      {
        actorId: "act123",
        hpDelta: -2,
        stressDelta: 1,
        statusEffect: "Vulnerable",
      },
      mockClient,
    );

    expect(mockClient.updateActorAttribute).toHaveBeenCalledWith("act123", {
      "system.resources.hp.value": 3,
      "system.resources.stress.value": 2,
    });
    expect(result.content[0].text).toContain("Forest Goblin");
    expect(result.content[0].text).toContain("Vulnerable");
  });

  it("should throw error if actor is not found", async () => {
    const mockClient = {
      getRawActor: vi.fn().mockReturnValue(null),
    } as unknown as FoundryClient;

    await expect(
      handleModifyDaggerheartCombatResources(
        { actorId: "nonexistent" },
        mockClient,
      ),
    ).rejects.toThrow();
  });
});
