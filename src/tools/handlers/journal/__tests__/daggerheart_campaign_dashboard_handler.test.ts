import { describe, expect, it, vi } from "vitest";
import type { FoundryClient } from "../../../../foundry/client.js";
import { handleCreateDaggerheartCampaignDashboard } from "../daggerheart_campaign_dashboard_handler.js";

describe("handleCreateDaggerheartCampaignDashboard", () => {
  it("should create a campaign dashboard journal entry", async () => {
    const mockClient = {
      createJournal: vi
        .fn()
        .mockResolvedValue({ _id: "dash99", name: "Dashboard: Whisperstone" }),
      getFolders: vi.fn().mockReturnValue([]),
    } as unknown as FoundryClient;

    const result = await handleCreateDaggerheartCampaignDashboard(
      {
        campaignTitle: "Whisperstone",
        campaignDescription: "A campaign about ancient magic and dragon cults.",
        setting: "Verdant Reach",
        template: "five-part-adventure",
      },
      mockClient,
    );

    expect(mockClient.createJournal).toHaveBeenCalledTimes(1);
    const callArgs = (mockClient.createJournal as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(callArgs[0]).toBe("Dashboard: Whisperstone");
    expect(callArgs[1]).toContain("Whisperstone");
    expect(callArgs[1]).toContain("Party Hope Tracker");
    expect(callArgs[1]).toContain("GM Fear Pool");
    expect(result.content[0].text).toContain("ID: dash99");
  });
});
