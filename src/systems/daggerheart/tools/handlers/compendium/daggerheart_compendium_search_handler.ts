import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { FoundryClient } from "../../../../../foundry/client.js";
import { withToolError } from "../../../../../tools/handlers/utils.js";
import {
  type DaggerheartCompendiumSearchPayload,
  parseDaggerheartCompendiumSearchArgs,
} from "./schemas/daggerheart_compendium_schema.js";

export async function handleSearchDaggerheartCompendium(
  args: unknown,
  foundryClient: FoundryClient,
) {
  return withToolError("search Daggerheart compendium", async () => {
    let payload: DaggerheartCompendiumSearchPayload;
    try {
      payload = parseDaggerheartCompendiumSearchArgs(args);
    } catch (err) {
      throw new McpError(
        ErrorCode.InvalidParams,
        err instanceof Error ? err.message : "Invalid parameters",
      );
    }

    const { query, itemType, domain, level, attackRange } = payload;

    const searchResult = await foundryClient.searchCompendium({
      query: query || "",
      itemType: itemType || undefined,
    });

    const rawResults = (searchResult?.results || []) as unknown as Array<
      Record<string, unknown>
    >;

    const filtered = rawResults.filter((entry: Record<string, unknown>) => {
      if (itemType && entry.type !== itemType) {
        return false;
      }
      const system = (entry.system as Record<string, unknown>) || {};
      if (domain && system.domain !== domain) {
        return false;
      }
      if (level !== undefined && system.level !== level) {
        return false;
      }
      if (
        attackRange &&
        (system.range as string)?.toLowerCase() !== attackRange.toLowerCase()
      ) {
        return false;
      }
      return true;
    });

    const filterInfo: string[] = [];
    if (itemType) filterInfo.push(`Type: ${itemType}`);
    if (domain) filterInfo.push(`Domain: ${domain}`);
    if (level !== undefined) filterInfo.push(`Level: ${level}`);
    if (attackRange) filterInfo.push(`Range: ${attackRange}`);

    const filterText =
      filterInfo.length > 0 ? ` [Filters: ${filterInfo.join(", ")}]` : "";

    const listText =
      filtered.length > 0
        ? filtered
            .slice(0, 15)
            .map((item: Record<string, unknown>) => {
              const sys = (item.system as Record<string, unknown>) || {};
              const extra = sys.domain
                ? ` (${sys.domain} Lvl ${sys.level})`
                : "";
              return `- **${item.name}** (${item.type || "item"})${extra} [ID: ${item._id}]`;
            })
            .join("\n")
        : "No matching Daggerheart compendium entries found.";

    return {
      content: [
        {
          type: "text",
          text: `📚 **Daggerheart Compendium Search**${filterText}\nFound ${filtered.length} entries:\n\n${listText}`,
        },
      ],
    };
  });
}
