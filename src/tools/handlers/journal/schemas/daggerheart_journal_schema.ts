import { z } from "zod";

export const DaggerheartQuestTypes = [
  "main",
  "side",
  "personal",
  "mystery",
  "bounty",
] as const;

export const DaggerheartDifficulties = [
  "easy",
  "medium",
  "hard",
  "deadly",
] as const;

export const DaggerheartQuestJournalSchema = z.object({
  questTitle: z.string().min(1, "questTitle is required"),
  questDescription: z.string().min(1, "questDescription is required"),
  questType: z.enum(DaggerheartQuestTypes).optional().default("side"),
  difficulty: z.enum(DaggerheartDifficulties).optional().default("medium"),
  location: z.string().optional(),
  questGiver: z.string().optional(),
  rewards: z.string().optional(),
  objectives: z.array(z.string()).optional().default([]),
  folder: z.string().optional(),
});

export type DaggerheartQuestJournalPayload = z.infer<
  typeof DaggerheartQuestJournalSchema
>;

export const DaggerheartCampaignTemplates = [
  "five-part-adventure",
  "sandbox",
  "investigation",
  "custom",
] as const;

export const DaggerheartCampaignActSchema = z.object({
  title: z.string().min(1, "Act title is required"),
  description: z.string().min(1, "Act description is required"),
});

export const DaggerheartCampaignDashboardSchema = z.object({
  campaignTitle: z.string().min(1, "campaignTitle is required"),
  campaignDescription: z.string().min(1, "campaignDescription is required"),
  setting: z.string().optional(),
  template: z
    .enum(DaggerheartCampaignTemplates)
    .optional()
    .default("five-part-adventure"),
  acts: z.array(DaggerheartCampaignActSchema).optional().default([]),
  folder: z.string().optional(),
});

export type DaggerheartCampaignDashboardPayload = z.infer<
  typeof DaggerheartCampaignDashboardSchema
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
