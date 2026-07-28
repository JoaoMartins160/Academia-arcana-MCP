import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import type { FoundryClient } from "../../../../../foundry/client.js";
import {
  resolveFolderId,
  withToolError,
} from "../../../../../tools/handlers/utils.js";
import { routeToolRequest } from "../../../../../tools/router.js";
import { logger } from "../../../../../utils/logger.js";
import {
  type DaggerheartActionGraphPayload,
  parseDaggerheartActionGraphArgs,
} from "./schemas/daggerheart_action_graph_schema.js";

function resolveTemplateVariables(
  val: unknown,
  contextResults: Record<string, unknown>,
): unknown {
  if (typeof val === "string") {
    return val.replace(/\$\{([^}]+)\}/g, (match, expr: string) => {
      const parts = expr.split(".");
      const nodeId = parts[0];
      const fieldPath = parts.slice(1).join(".");

      const nodeRes = contextResults[nodeId];
      if (!nodeRes) return match;

      if (!fieldPath) return String(nodeRes);

      let current: unknown = nodeRes;
      for (const p of parts.slice(1)) {
        if (current && typeof current === "object" && p in current) {
          current = (current as Record<string, unknown>)[p];
        } else {
          return match;
        }
      }
      return String(current);
    });
  }

  if (Array.isArray(val)) {
    return val.map((v) => resolveTemplateVariables(v, contextResults));
  }

  if (val && typeof val === "object") {
    const res: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val)) {
      res[k] = resolveTemplateVariables(v, contextResults);
    }
    return res;
  }

  return val;
}

export async function handleExecuteDaggerheartActionGraph(
  args: unknown,
  foundryClient: FoundryClient,
) {
  return withToolError("execute Daggerheart action graph", async () => {
    let graph: DaggerheartActionGraphPayload;
    try {
      graph = parseDaggerheartActionGraphArgs(args);
    } catch (err) {
      throw new McpError(
        ErrorCode.InvalidParams,
        err instanceof Error ? err.message : "Invalid parameters",
      );
    }

    const { graphName, stopOnError, nodes } = graph;
    const contextResults: Record<string, unknown> = {};
    const executionLogs: string[] = [];

    logger.info(
      `[DaggerheartActionGraph] Starting workflow '${graphName}' (${nodes.length} nodes)...`,
    );

    for (const node of nodes) {
      const resolvedArgs = resolveTemplateVariables(
        node.args,
        contextResults,
      ) as Record<string, unknown>;

      try {
        const result = await routeToolRequest(
          node.toolName,
          resolvedArgs,
          foundryClient,
        );
        contextResults[node.id] = result;
        executionLogs.push(`✅ [${node.id}] ${node.toolName} — Success`);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        executionLogs.push(
          `❌ [${node.id}] ${node.toolName} — Failed: ${errMsg}`,
        );
        if (stopOnError) {
          logger.warn(
            `[DaggerheartActionGraph] Workflow '${graphName}' halted at node '${node.id}' due to error: ${errMsg}`,
          );
          break;
        }
      }
    }

    const summaryText = `🕸️ **Daggerheart Action Graph Execution** — "${graphName}"\n**Total Nodes:** ${nodes.length}\n\n**Execution Log:**\n${executionLogs.join("\n")}`;

    return {
      content: [
        {
          type: "text",
          text: summaryText,
        },
      ],
    };
  });
}
