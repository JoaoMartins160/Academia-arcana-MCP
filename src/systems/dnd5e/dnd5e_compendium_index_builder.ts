import type { IndexBuilder, SystemCreatureIndex } from "../system_types.js";

export class Dnd5eIndexBuilder implements IndexBuilder {
  getSystemId() {
    return "dnd5e" as const;
  }

  async buildIndex(
    packs: Record<string, unknown>[],
    _force?: boolean,
  ): Promise<SystemCreatureIndex[]> {
    const results: SystemCreatureIndex[] = [];

    for (const pack of packs) {
      const items = (pack.index as Record<string, unknown>[]) || [];
      for (const doc of items) {
        const type = (doc.type as string) || "";
        if (!["npc", "character"].includes(type)) continue;

        results.push({
          id: (doc._id as string) || (doc.id as string) || "",
          name: (doc.name as string) || "Unnamed",
          type,
          packName: (pack.name as string) || (pack.id as string) || "",
          packLabel: (pack.label as string) || "",
          img: (doc.img as string) || undefined,
          system: "dnd5e",
          systemData: {},
        });
      }
    }

    return results;
  }
}
