import { describe, expect, it } from "vitest";
import { handleRollDaggerheartDualityExtended } from "../daggerheart_duality_roll_handler.js";

describe("handleRollDaggerheartDualityExtended", () => {
  it("should calculate duality roll outcome with modifier and advantage", async () => {
    const result = await handleRollDaggerheartDualityExtended({
      modifier: 2,
      advantage: true,
      reason: "Agility Check",
    });

    const text = result.content[0].text;
    expect(text).toContain("Daggerheart Duality Roll");
    expect(text).toContain("Agility Check");
    expect(text).toContain("Hope Die (d12)");
    expect(text).toContain("Fear Die (d12)");
    expect(text).toContain("Advantage d6");
  });
});
