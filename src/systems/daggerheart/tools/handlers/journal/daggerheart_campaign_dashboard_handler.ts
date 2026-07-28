import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { FoundryClient } from "../../../../../foundry/client.js";
import {
  resolveFolderId,
  withToolError,
} from "../../../../../tools/handlers/utils.js";
import {
  type DaggerheartCampaignDashboardPayload,
  parseDaggerheartCampaignDashboardArgs,
} from "./schemas/daggerheart_journal_schema.js";

export function formatDaggerheartClockProgress(
  progress: number,
  max: number,
): string {
  const filled = "▰".repeat(Math.min(progress, max));
  const empty = "▱".repeat(Math.max(0, max - progress));
  return `[${filled}${empty}] (${progress}/${max})`;
}

export async function handleCreateDaggerheartCampaignDashboard(
  args: unknown,
  foundryClient: FoundryClient,
) {
  return withToolError("create Daggerheart campaign dashboard", async () => {
    let payload: DaggerheartCampaignDashboardPayload;
    try {
      payload = parseDaggerheartCampaignDashboardArgs(args);
    } catch (err) {
      throw new McpError(
        ErrorCode.InvalidParams,
        err instanceof Error ? err.message : "Invalid parameters",
      );
    }

    const { campaignTitle, partyHope, gmFear, activeQuests, clocks, folder } =
      payload;

    const folderId = resolveFolderId(foundryClient, folder, "JournalEntry");

    const questList =
      activeQuests.length > 0
        ? activeQuests.map((q) => `- 📜 ${q}`).join("\n")
        : "*No active quests registered.*";

    const clockList =
      clocks.length > 0
        ? clocks
            .map(
              (c) =>
                `- ⏳ **${c.name}**: ${formatDaggerheartClockProgress(c.progress, c.max)}`,
            )
            .join("\n")
        : "*No active countdown clocks.*";

    const pageContent = `<h1>🏰 Campaign Dashboard: ${campaignTitle}</h1>
<hr />
<h2>⚡ Pool & Resources</h2>
<p><strong>Party Hope Pool:</strong> ${partyHope} ✨ | <strong>GM Fear Pool:</strong> ${gmFear} 💀</p>

<h2>📜 Active Quests</h2>
${questList.replace(/\n/g, "<br/>")}

<h2>⏳ Countdown Clocks</h2>
${clockList.replace(/\n/g, "<br/>")}`;

    const journal = await foundryClient.createJournal(
      `Dashboard: ${campaignTitle}`,
      pageContent,
      folderId,
    );

    return {
      content: [
        {
          type: "text",
          text: `🏰 **Daggerheart Campaign Dashboard Created**\n**Title:** ${campaignTitle} (ID: ${journal._id})\n**Party Hope:** ${partyHope} | **GM Fear:** ${gmFear}\n**Active Quests:** ${activeQuests.length} | **Clocks:** ${clocks.length}`,
        },
      ],
    };
  });
}
