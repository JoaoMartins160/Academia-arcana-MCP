import { describe, expect, it, vi } from "vitest";
import type { FoundryClient } from "../../../../../../foundry/client.js";
import { handleCreateDaggerheartCampaignDashboard } from "../daggerheart_campaign_dashboard_handler.js";

describe("handleCreateDaggerheartCampaignDashboard", () => {
  it("should create a campaign dashboard journal entry", async () => {
    const mockClient = {
      createJournal: vi
        .fn()
        .mockResolvedValue({ _id: "dash123", name: "Dashboard: Realm" }),
      getFolders: vi.fn().mockReturnValue([]),
    } as unknown as FoundryClient;

    const result = await handleCreateDaggerheartCampaignDashboard(
      {
        campaignTitle: "Realm of Fear",
        partyHope: 4,
        gmFear: 2,
        activeQuests: ["Find the Lost Sun"],
        clocks: [{ name: "Eclipse", progress: 2, max: 6 }],
      },
      mockClient,
    );

    expect(mockClient.createJournal).toHaveBeenCalledWith(
      "Dashboard: Realm of Fear",
      expect.any(String),
      undefined,
    );

    const text = result.content[0].text;
    expect(text).toContain("Realm of Fear");
    expect(text).toContain("Party Hope:** 4");
    expect(text).toContain("GM Fear:** 2");
  });
});
