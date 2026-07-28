import { describe, expect, it, vi } from "vitest";
import type { FoundryClient } from "../../../../../../foundry/client.js";
import { handleInvokeDaggerheartExperience } from "../daggerheart_experience_invocation_handler.js";

describe("handleInvokeDaggerheartExperience", () => {
  it("should invoke experience and deduct 1 Hope", async () => {
    const mockClient = {
      getRawActor: vi.fn().mockReturnValue({
        name: "Valerius",
        system: {
          resources: { hope: { value: 3 } },
        },
      }),
      updateActorAttribute: vi.fn().mockResolvedValue({ success: true }),
    } as unknown as FoundryClient;

    const result = await handleInvokeDaggerheartExperience(
      {
        actorId: "act101",
        experienceName: "Monster Hunter",
        modifier: 2,
        spendHope: true,
      },
      mockClient,
    );

    expect(mockClient.updateActorAttribute).toHaveBeenCalledWith("act101", {
      "system.resources.hope.value": 2,
    });

    const text = result.content[0].text;
    expect(text).toContain("Valerius");
    expect(text).toContain("Monster Hunter");
    expect(text).toContain("Spent 1 Hope");
  });
});
