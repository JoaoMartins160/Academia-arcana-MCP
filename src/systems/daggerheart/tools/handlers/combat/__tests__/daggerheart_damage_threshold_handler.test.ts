import { describe, expect, it, vi } from "vitest";
import type { FoundryClient } from "../../../../../../foundry/client.js";
import { handleApplyDaggerheartDamageWithThresholds } from "../daggerheart_damage_threshold_handler.js";

describe("handleApplyDaggerheartDamageWithThresholds", () => {
  it("should calculate Major threshold damage and apply HP loss", async () => {
    const mockClient = {
      getRawActor: vi.fn().mockReturnValue({
        name: "Garrick",
        system: {
          thresholds: { minor: 5, major: 11, severe: 17 },
          resources: { hp: { value: 10 } },
          armor: 3,
        },
      }),
      updateActorAttribute: vi.fn().mockResolvedValue({ success: true }),
    } as unknown as FoundryClient;

    const result = await handleApplyDaggerheartDamageWithThresholds(
      {
        actorId: "pc123",
        damageTotal: 14,
        damageType: "physical",
        useArmorSlot: false,
      },
      mockClient,
    );

    expect(mockClient.updateActorAttribute).toHaveBeenCalledWith("pc123", {
      "system.resources.hp.value": 8,
    });

    const text = result.content[0].text;
    expect(text).toContain("Garrick");
    expect(text).toContain("MAJOR Threshold");
    expect(text).toContain("-2 HP");
  });

  it("should mitigate damage when Armor Slot is used", async () => {
    const mockClient = {
      getRawActor: vi.fn().mockReturnValue({
        name: "Garrick",
        system: {
          thresholds: { minor: 5, major: 11, severe: 17 },
          resources: { hp: { value: 10 } },
          armor: 4,
        },
      }),
      updateActorAttribute: vi.fn().mockResolvedValue({ success: true }),
    } as unknown as FoundryClient;

    const result = await handleApplyDaggerheartDamageWithThresholds(
      {
        actorId: "pc123",
        damageTotal: 14,
        damageType: "physical",
        useArmorSlot: true,
      },
      mockClient,
    );

    expect(mockClient.updateActorAttribute).toHaveBeenCalledWith("pc123", {
      "system.resources.hp.value": 9,
    });

    const text = result.content[0].text;
    expect(text).toContain("Armor Slot Used");
    expect(text).toContain("MINOR Threshold");
    expect(text).toContain("-1 HP");
  });
});
