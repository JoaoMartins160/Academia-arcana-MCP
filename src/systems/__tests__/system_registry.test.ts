import { beforeEach, describe, expect, it } from "vitest";
import type { z } from "zod";
import {
  SystemRegistry,
  getSystemRegistry,
  resetSystemRegistry,
} from "../system_registry.js";
import type {
  SystemAdapter,
  SystemCreatureIndex,
  SystemMetadata,
} from "../system_types.js";

class DummyAdapter implements SystemAdapter {
  getMetadata(): SystemMetadata {
    return {
      id: "dnd5e",
      name: "dnd5e",
      displayName: "D&D 5e",
      version: "1.0.0",
      description: "Dummy 5e",
      supportedFeatures: {
        creatureIndex: true,
        characterStats: true,
        spellcasting: true,
        powerLevel: true,
      },
    };
  }

  canHandle(systemId: string): boolean {
    return systemId === "dnd5e" || systemId === "5e";
  }

  extractCreatureData(): {
    creature: SystemCreatureIndex;
    errors: number;
  } | null {
    return null;
  }

  getFilterSchema(): z.ZodSchema {
    return {} as z.ZodSchema;
  }

  matchesFilters(): boolean {
    return true;
  }

  getDataPaths(): Record<string, string | null> {
    return {};
  }

  formatCreatureForList(): Record<string, unknown> {
    return {};
  }

  formatCreatureForDetails(): Record<string, unknown> {
    return {};
  }

  describeFilters(): string {
    return "none";
  }

  getPowerLevel(): number | undefined {
    return 1;
  }

  extractCharacterStats(): Record<string, unknown> {
    return {};
  }
}

describe("SystemRegistry", () => {
  beforeEach(() => {
    resetSystemRegistry();
  });

  it("should register and retrieve adapters by exact systemId", () => {
    const registry = new SystemRegistry();
    const dummy = new DummyAdapter();
    registry.register(dummy);

    expect(registry.isSupported("dnd5e")).toBe(true);
    expect(registry.getAdapter("dnd5e")).toBe(dummy);
  });

  it("should retrieve adapter by alias matching via canHandle()", () => {
    const registry = new SystemRegistry();
    const dummy = new DummyAdapter();
    registry.register(dummy);

    expect(registry.getAdapter("5e")).toBe(dummy);
  });

  it("should return null for unsupported systems", () => {
    const registry = new SystemRegistry();
    expect(registry.getAdapter("unknown-system")).toBeNull();
    expect(registry.isSupported("unknown-system")).toBe(false);
  });

  it("should manage global singleton instance", () => {
    const r1 = getSystemRegistry();
    const r2 = getSystemRegistry();
    expect(r1).toBe(r2);
  });
});
