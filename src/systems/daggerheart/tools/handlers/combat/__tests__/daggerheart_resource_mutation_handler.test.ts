import { describe, expect, it, vi } from "vitest";
import type { FoundryClient } from "../../../../../../foundry/client.js";
import { handleModifyDaggerheartCombatResources } from "../daggerheart_resource_mutation_handler.js";

describe("handleModifyDaggerheartCombatResources", () => {
  it("should update actor hope and stress values", async () => {
    const mockClient = {
      getRawActor: vi.fn().mockReturnValue({
        name: "Kaelen",
        system: {
          resources: {
            hope: { value: 2, max: 6 },
            stress: { value: 1, max: 5 },
          },
        },
      }),
      updateActorAttribute: vi.fn().mockResolvedValue({ success: true }),
    } as unknown as FoundryClient;

    const result = await handleModifyDaggerheartCombatResources(
      {
        actorId: "actor123",
        hopeDelta: 1,
        stressDelta: 1,
      },
      mockClient,
    );

    expect(mockClient.updateActorAttribute).toHaveBeenCalledWith("actor123", {
      "system.resources.hope.value": 3,
      "system.resources.stress.value": 2,
    });

    const text = result.content[0].text;
    expect(text).toContain("Kaelen");
    expect(text).toContain("Hope:");
    expect(text).toContain("Stress:");
  });
});
