import { describe, expect, it } from "vitest";
import {
  evaluateDualityRoll,
  handleRollDaggerheartDualityExtended,
} from "../daggerheart_duality_roll_handler.js";

describe("evaluateDualityRoll", () => {
  it("should detect Hope, Fear and Critical Success outcomes correctly", () => {
    expect(evaluateDualityRoll(10, 4, 0).isHope).toBe(true);
    expect(evaluateDualityRoll(3, 9, 0).isHope).toBe(false);

    const crit = evaluateDualityRoll(7, 7, 0);
    expect(crit.isCritical).toBe(true);
    expect(crit.outcome).toContain("CRITICAL SUCCESS");
  });
});

describe("handleRollDaggerheartDualityExtended", () => {
  it("should execute a duality roll and return formatted MCP text", async () => {
    const result = await handleRollDaggerheartDualityExtended({
      modifier: 2,
      reason: "Spellcasting Test",
    });

    const text = result.content[0].text;
    expect(text).toContain("Daggerheart Duality Roll");
    expect(text).toContain("Spellcasting Test");
    expect(text).toContain("Total Score:");
  });
});
