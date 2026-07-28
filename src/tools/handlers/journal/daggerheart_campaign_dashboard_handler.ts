import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";
import type { FoundryClient } from "../../../foundry/client.js";
import { resolveFolderId, withToolError } from "../utils.js";
import {
  type DaggerheartCampaignActSchema,
  type DaggerheartCampaignDashboardPayload,
  parseDaggerheartCampaignDashboardArgs,
} from "./schemas/daggerheart_journal_schema.js";

export type DaggerheartCampaignAct = z.infer<
  typeof DaggerheartCampaignActSchema
>;
export type {
  DaggerheartCampaignDashboardPayload as DaggerheartCampaignDashboardArgs,
};

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

    const {
      campaignTitle,
      campaignDescription,
      setting,
      template,
      acts,
      folder,
    } = payload;

    const folderId = resolveFolderId(foundryClient, folder, "JournalEntry");

    const defaultActs: DaggerheartCampaignAct[] =
      acts && acts.length > 0
        ? acts
        : template === "five-part-adventure"
          ? [
              {
                title: "Act 1: Inciting Incident & Call to Adventure",
                description:
                  "The party discovers the central threat and leaves the safe zone.",
              },
              {
                title: "Act 2: Rising Conflict & First Failure",
                description:
                  "Stakes escalate; adversaries force the party to make hard choices.",
              },
              {
                title: "Act 3: Midpoint Crisis & Major Discovery",
                description: "A major revelation reshapes the campaign goal.",
              },
              {
                title: "Act 4: Darkest Hour & Preparing the Assault",
                description:
                  "The party gathers allies and resources for the final confrontation.",
              },
              {
                title: "Act 5: Climax & Resolution",
                description:
                  "Final showdown with the primary adversary and aftermath.",
              },
            ]
          : [
              {
                title: "Chapter 1: Foundations",
                description: "Initial exploration and character introductions.",
              },
              {
                title: "Chapter 2: Escalation",
                description: "Factions move and major plots unfold.",
              },
            ];

    const actsHtml = defaultActs
      .map(
        (act, idx) => `
<div style="margin-bottom: 12px; padding: 10px; border: 1px solid #ccc; border-radius: 6px; background-color: #fafafa;">
  <h4 style="margin: 0 0 5px 0; color: #1a237e;">Part ${idx + 1}: ${act.title}</h4>
  <p style="margin: 0; font-size: 0.9em; color: #555;">${act.description}</p>
</div>`,
      )
      .join("");

    const fullHtmlContent = `
<div class="daggerheart-campaign-dashboard" style="font-family: sans-serif; padding: 12px;">
  <h1 style="border-bottom: 3px solid #1a237e; color: #1a237e; padding-bottom: 6px;">🗡️ ${campaignTitle}</h1>
  ${setting ? `<p><strong>Setting / Location:</strong> ${setting}</p>` : ""}
  
  <div style="background-color: #e8eaf6; padding: 12px; border-radius: 6px; margin: 15px 0;">
    <h3 style="margin-top: 0; color: #283593;">Campaign Overview</h3>
    <p style="margin-bottom: 0;">${campaignDescription}</p>
  </div>

  <div style="display: flex; gap: 15px; margin: 15px 0;">
    <div style="flex: 1; padding: 10px; background-color: #fff3e0; border-left: 4px solid #ff9800; border-radius: 4px;">
      <strong>🌟 Party Hope Tracker:</strong> [ ] [ ] [ ] [ ] [ ] [ ]
    </div>
    <div style="flex: 1; padding: 10px; background-color: #f3e5f5; border-left: 4px solid #9c27b0; border-radius: 4px;">
      <strong>💀 GM Fear Pool:</strong> [ ] [ ] [ ] [ ] [ ] [ ]
    </div>
  </div>

  <h3 style="color: #1a237e; border-bottom: 1px solid #ddd; padding-bottom: 4px;">Campaign Arc & Structure</h3>
  ${actsHtml}

  <h3 style="color: #1a237e; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 20px;">Session Logs Index</h3>
  <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
    <thead>
      <tr style="background-color: #f0f0f0; text-align: left;">
        <th style="padding: 6px; border: 1px solid #ddd;">Session #</th>
        <th style="padding: 6px; border: 1px solid #ddd;">Date</th>
        <th style="padding: 6px; border: 1px solid #ddd;">Summary / Highlights</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 6px; border: 1px solid #ddd;">Session 0</td>
        <td style="padding: 6px; border: 1px solid #ddd;">—</td>
        <td style="padding: 6px; border: 1px solid #ddd;">Character creation, Connections & World building</td>
      </tr>
    </tbody>
  </table>
</div>`;

    const result = await foundryClient.createJournal(
      `Dashboard: ${campaignTitle}`,
      fullHtmlContent,
      folderId,
    );

    return {
      content: [
        {
          type: "text",
          text: `Successfully created Daggerheart Campaign Dashboard "${campaignTitle}" (ID: ${result._id})`,
        },
      ],
    };
  });
}
