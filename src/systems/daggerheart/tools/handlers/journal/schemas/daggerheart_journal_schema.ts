import { z } from "zod";

export const DaggerheartQuestTypeEnum = z.enum([
  "main",
  "side",
  "character",
  "faction",
]);
export const DaggerheartDifficultyEnum = z.enum([
  "easy",
  "medium",
  "hard",
  "deadly",
]);

export const DaggerheartQuestJournalSchema = z.object({
  questTitle: z.string().min(1, "Quest title is required"),
  summary: z.string().min(1, "Summary is required"),
  questType: DaggerheartQuestTypeEnum.optional().default("main"),
  difficulty: DaggerheartDifficultyEnum.optional().default("medium"),
  objectives: z.array(z.string()).optional().default([]),
  rewards: z.array(z.string()).optional().default([]),
  folder: z.string().optional(),
});

export type DaggerheartQuestJournalPayload = z.infer<
  typeof DaggerheartQuestJournalSchema
>;

export function parseDaggerheartQuestJournalArgs(
  args: unknown,
): DaggerheartQuestJournalPayload {
  const parsed = DaggerheartQuestJournalSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(
      `Invalid Daggerheart Quest Journal payload: ${parsed.error.errors.map((e) => e.message).join(", ")}`,
    );
  }
  return parsed.data;
}

export const DaggerheartClockSchema = z.object({
  name: z.string().min(1),
  progress: z.number().min(0),
  max: z.number().min(1),
});

export const DaggerheartCampaignDashboardSchema = z.object({
  campaignTitle: z.string().min(1, "Campaign title is required"),
  partyHope: z.number().optional().default(0),
  gmFear: z.number().optional().default(0),
  activeQuests: z.array(z.string()).optional().default([]),
  clocks: z.array(DaggerheartClockSchema).optional().default([]),
  folder: z.string().optional(),
});

export type DaggerheartCampaignDashboardPayload = z.infer<
  typeof DaggerheartCampaignDashboardSchema
>;

export function parseDaggerheartCampaignDashboardArgs(
  args: unknown,
): DaggerheartCampaignDashboardPayload {
  const parsed = DaggerheartCampaignDashboardSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error(
      `Invalid Daggerheart Campaign Dashboard payload: ${parsed.error.errors.map((e) => e.message).join(", ")}`,
    );
  }
  return parsed.data;
}
