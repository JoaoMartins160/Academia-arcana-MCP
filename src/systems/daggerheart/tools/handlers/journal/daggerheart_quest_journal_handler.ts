import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { FoundryClient } from "../../../../../foundry/client.js";
import {
  resolveFolderId,
  withToolError,
} from "../../../../../tools/handlers/utils.js";
import {
  type DaggerheartQuestJournalPayload,
  parseDaggerheartQuestJournalArgs,
} from "./schemas/daggerheart_journal_schema.js";

export async function handleCreateDaggerheartQuestJournal(
  args: unknown,
  foundryClient: FoundryClient,
) {
  return withToolError("create Daggerheart quest journal", async () => {
    let payload: DaggerheartQuestJournalPayload;
    try {
      payload = parseDaggerheartQuestJournalArgs(args);
    } catch (err) {
      throw new McpError(
        ErrorCode.InvalidParams,
        err instanceof Error ? err.message : "Invalid parameters",
      );
    }

    const {
      questTitle,
      summary,
      questType,
      difficulty,
      objectives,
      rewards,
      folder,
    } = payload;

    const folderId = resolveFolderId(foundryClient, folder, "JournalEntry");

    const objList =
      objectives.length > 0
        ? objectives.map((o) => `[ ] ${o}`).join("\n")
        : "None specified.";
    const rewardList =
      rewards.length > 0 ? rewards.join(", ") : "Standard XP / Gold";

    const pageContent = `<h1>📜 Quest: ${questTitle}</h1>
<p><strong>Type:</strong> ${questType?.toUpperCase()} | <strong>Difficulty:</strong> ${difficulty?.toUpperCase()}</p>
<hr />
<h2>Summary</h2>
<p>${summary}</p>
<h2>Objectives</h2>
<pre>${objList}</pre>
<h2>Rewards</h2>
<p>${rewardList}</p>`;

    const journal = await foundryClient.createJournal(
      `Quest: ${questTitle}`,
      pageContent,
      folderId,
    );

    return {
      content: [
        {
          type: "text",
          text: `📜 **Daggerheart Quest Journal Created**\n**Title:** ${questTitle} (ID: ${journal._id})\n**Type:** ${questType} | **Difficulty:** ${difficulty}\n**Objectives (${objectives.length}):**\n${objList}`,
        },
      ],
    };
  });
}
