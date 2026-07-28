import { logger } from "../../utils/logger.js";
import type {
  IndexBuilder,
  SystemCreatureIndex,
  SystemId,
} from "../system_types.js";
import { DaggerheartSystemAdapter } from "./daggerheart_system_adapter.js";

export class DaggerheartIndexBuilder implements IndexBuilder {
  private adapter: DaggerheartSystemAdapter;

  constructor() {
    this.adapter = new DaggerheartSystemAdapter();
  }

  getSystemId(): SystemId {
    return "daggerheart";
  }

  async buildIndex(
    packs: Record<string, unknown>[],
    _force = false,
  ): Promise<SystemCreatureIndex[]> {
    const creatures: SystemCreatureIndex[] = [];
    const actorPacks = packs.filter(
      (p) =>
        p.metadata && (p.metadata as Record<string, unknown>).type === "Actor",
    );

    logger.info(
      `[DaggerheartIndexBuilder] Building index from ${actorPacks.length} actor compendiums...`,
    );

    for (const pack of actorPacks) {
      try {
        const getDocuments = pack.getDocuments as
          | (() => Promise<Record<string, unknown>[]>)
          | undefined;
        if (!getDocuments) continue;

        const docs = await getDocuments.call(pack);
        for (const doc of docs) {
          const result = this.adapter.extractCreatureData(doc, pack);
          if (result?.creature) {
            creatures.push(result.creature);
          }
        }
      } catch (error) {
        logger.warn(
          `[DaggerheartIndexBuilder] Error processing pack ${pack.name}:`,
          error,
        );
      }
    }

    logger.info(
      `[DaggerheartIndexBuilder] Index complete with ${creatures.length} creatures.`,
    );
    return creatures;
  }
}
