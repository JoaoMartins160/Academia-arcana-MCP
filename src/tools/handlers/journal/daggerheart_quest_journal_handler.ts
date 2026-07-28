import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { FoundryClient } from "../../../foundry/client.js";
import { resolveFolderId, withToolError } from "../utils.js";
import {
  type DaggerheartQuestJournalPayload,
  parseDaggerheartQuestJournalArgs,
} from "./schemas/daggerheart_journal_schema.js";

export type { DaggerheartQuestJournalPayload as DaggerheartQuestJournalArgs };

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
      questDescription,
      questType,
      difficulty,
      location,
      questGiver,
      rewards,
      objectives,
      folder,
    } = payload;

    const folderId = resolveFolderId(foundryClient, folder, "JournalEntry");

    const difficultyColors: Record<string, string> = {
      easy: "#2e7d32",
      medium: "#ed6c02",
      hard: "#d32f2f",
      deadly: "#9c27b0",
    };

    const diffColor = difficultyColors[difficulty] || "#0288d1";

    const objectivesHtml =
      objectives.length > 0
        ? `
<div style="margin-top: 15px;">
  <h4 style="margin-bottom: 5px; color: #444;">Quest Objectives:</h4>
  <ul style="list-style-type: square; padding-left: 20px;">
    ${objectives.map((obj) => `<li>${obj}</li>`).join("\n    ")}
  </ul>
</div>`
        : "";

    const rewardsHtml = rewards
      ? `
<div style="margin-top: 15px; padding: 10px; background-color: rgba(255, 215, 0, 0.1); border-left: 4px solid #ffd700; border-radius: 4px;">
  <strong>🎁 Quest Rewards:</strong> ${rewards}
</div>`
      : "";

    const metaHtml = `
<table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
  <tr>
    <td><strong>Type:</strong> <span style="text-transform: capitalize; font-weight: bold;">${questType}</span></td>
    <td><strong>Difficulty:</strong> <span style="color: ${diffColor}; text-transform: uppercase; font-weight: bold;">${difficulty}</span></td>
  </tr>
  ${location ? `<tr><td colspan="2"><strong>Location:</strong> ${location}</td></tr>` : ""}
  ${questGiver ? `<tr><td colspan="2"><strong>Quest Giver:</strong> ${questGiver}</td></tr>` : ""}
</table>`;

    const fullHtmlContent = `
<div class="daggerheart-quest-journal" style="font-family: sans-serif; padding: 10px;">
  <h2 style="border-bottom: 2px solid ${diffColor}; padding-bottom: 5px;">📜 ${questTitle}</h2>
  ${metaHtml}
  <div style="margin-top: 10px; line-height: 1.5;">
    ${questDescription}
  </div>
  ${objectivesHtml}
  ${rewardsHtml}
</div>`;

    const result = await foundryClient.createJournal(
      questTitle,
      fullHtmlContent,
      folderId,
    );

    return {
      content: [
        {
          type: "text",
          text: `Successfully created Daggerheart Quest Journal "${questTitle}" (ID: ${result._id})`,
        },
      ],
    };
  });
}
