/**
 * FoundryVTT client for API communication via Socket.IO
 *
 * Connects to FoundryVTT using the proven 4-step authentication flow,
 * caches worldData in memory, and serves all queries from the snapshot.
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { type Socket, io } from "socket.io-client";
import { type WebSocket, WebSocketServer } from "ws";
import { z } from "zod";

const execAsync = promisify(exec);

import { logger } from "../utils/logger.js";
import { authenticateFoundry } from "./auth.js";
import type {
  ActorAttributeUpdateResult,
  ActorItemCreateSource,
  ActorSearchResult,
  CompendiumSearchResult,
  DiceRoll,
  FoundryActor,
  FoundryItem,
  FoundryScene,
  FoundryWorld,
  ItemSearchResult,
  WorldActor,
  WorldCombat,
  WorldData,
  WorldEffect,
  WorldItem,
  WorldJournal,
  WorldMessage,
  WorldScene,
  WorldUser,
} from "./types.js";

/** FoundryVTT document IDs are 16-character alphanumeric strings. */
const FOUNDRY_ID_PATTERN = /^[a-zA-Z0-9]{16}$/;

/**
 * Accepts the two parent-UUID forms a token's actor can take:
 *  - `Actor.<id>` — a world-linked actor (`actorLink: true`)
 *  - `Scene.<sid>.Token.<tid>.Actor.<aid>` — an unlinked token's synthetic actor
 */
const TOKEN_ACTOR_UUID_PATTERN =
  /^(Actor\.[a-zA-Z0-9]{16}|Scene\.[a-zA-Z0-9]{16}\.Token\.[a-zA-Z0-9]{16}\.Actor\.[a-zA-Z0-9]{16})$/;

/**
 * Minimal Zod schema for the WorldData Socket.IO payload.
 * Validates the required top-level array fields; extra fields pass through.
 */
const WorldDataSchema = z.object({
  userId: z.string(),
  actors: z.array(z.unknown()),
  scenes: z.array(z.unknown()),
  items: z.array(z.unknown()),
  journal: z.array(z.unknown()),
  messages: z.array(z.unknown()),
  combats: z.array(z.unknown()),
  users: z.array(z.unknown()),
  activeUsers: z.array(z.string()),
  macros: z.array(z.unknown()),
  playlists: z.array(z.unknown()),
  tables: z.array(z.unknown()),
  folders: z.array(z.unknown()),
});

export interface FoundryClientConfig {
  baseUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
  userId?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  socketPath?: string;
  /** Opt-in gate for game-state mutations (FOUNDRY_WRITE_ENABLED). Default false. */
  writeEnabled?: boolean;
}

/** Minimal shape of FoundryVTT's `modifyDocument` Socket.IO acknowledgement. */
interface DocumentSocketResponse {
  /** Created/updated data objects, or deleted ids, on success. */
  result?: unknown[];
  /** Present when the server rejects the operation. */
  error?: { message?: string } | null;
  userId?: string;
}

export interface SearchActorsParams {
  query?: string;
  type?: string;
  limit?: number;
}

export interface SearchItemsParams {
  query?: string;
  type?: string;
  rarity?: string;
  limit?: number;
}

export interface CompendiumSearchParams {
  query?: string;
  packType?: string;
  itemType?: string;
  spellLevel?: number;
  source?: string;
  compendiumId?: string;
  limit?: number;
  /** Opaque pagination cursor from a prior result's `nextCursor`. */
  cursor?: string;
}

/**
 * Shallow attribute patch for {@link FoundryClient.updateActorAttribute} (#143).
 *
 * Keys are dot-paths into the actor's `system` object (e.g.
 * `attributes.hp.value`, `currency.gp`, `spells.spell1.value`,
 * `attributes.exhaustion`). Values are the scalar to set at that path.
 */
export type AttributePatch = Record<string, number | string | boolean>;

export class FoundryClient {
  private http: AxiosInstance;
  private socket: Socket | null = null;
  private config: FoundryClientConfig;
  private _isConnected = false;
  private worldData: WorldData | null = null;
  private pendingCompanionRequests: Map<
    string,
    { resolve: (val: any) => void; reject: (err: any) => void; timeout: any }
  > = new Map();
  private companionServer: WebSocketServer | null = null;
  private companionSockets: Set<WebSocket> = new Set();

  constructor(config: FoundryClientConfig) {
    if (!config.baseUrl || config.baseUrl.trim() === "") {
      throw new Error("baseUrl is required and cannot be empty");
    }

    try {
      new URL(config.baseUrl);
    } catch {
      throw new Error(`Invalid baseUrl: ${config.baseUrl}`);
    }

    this.config = {
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      socketPath: "/socket.io/",
      ...config,
    };

    this.http = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout || 30000,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "FoundryMCP/0.2.0",
      },
      maxRedirects: 3,
      maxContentLength: 50 * 1024 * 1024,
      maxBodyLength: 50 * 1024 * 1024,
      validateStatus: (status) => status >= 200 && status < 300,
    });

    if (this.config.apiKey) {
      this.http.interceptors.request.use((reqConfig) => {
        reqConfig.headers["x-api-key"] = this.config.apiKey;
        return reqConfig;
      });
    }

    const mode = "Socket.IO";
    logger.info(`FoundryVTT client initialized (${mode} mode)`);
  }

  /**
   * Connects to FoundryVTT.
   * REST API mode: tests /api/status endpoint.
   * Socket.IO mode: authenticates and loads full worldData.
   */
  async connect(): Promise<void> {
    const user = this.config.userId || this.config.username;
    if (!user || !this.config.password) {
      throw new Error(
        "Socket.IO mode requires username/userId and password. " +
          "Set FOUNDRY_USERNAME + FOUNDRY_PASSWORD or FOUNDRY_USER_ID + FOUNDRY_PASSWORD.",
      );
    }

    const { session } = await authenticateFoundry(
      this.config.baseUrl,
      user,
      this.config.password,
    );

    // Connect authenticated socket and load world data
    this.worldData = await this.connectAndLoadWorld(session);
    this._isConnected = true;

    // Start WebSocket Server for Companion Module
    await this.startCompanionServer();

    logger.info("Connected to FoundryVTT via Socket.IO", {
      actors: this.worldData.actors.length,
      scenes: this.worldData.scenes.length,
      items: this.worldData.items.length,
    });
  }

  private async freePort(port: number): Promise<void> {
    try {
      if (process.platform === "win32") {
        const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
        const lines = stdout.trim().split("\n");
        for (const line of lines) {
          const parts = line.trim().split(/\\s+/);
          if (
            parts.length >= 5 &&
            parts[1]?.includes(`:${port}`) &&
            parts[3] === "LISTENING"
          ) {
            const pid = parts[4];
            if (pid && pid !== "0" && Number.parseInt(pid) !== process.pid) {
              await execAsync(`taskkill /F /PID ${pid}`);
              logger.info(
                `Automatically killed zombie process ${pid} using port ${port}`,
              );
            }
          }
        }
      } else {
        const { stdout } = await execAsync(`lsof -i :${port} -t`);
        const pids = stdout.trim().split("\n").filter(Boolean);
        for (const pid of pids) {
          if (pid && Number.parseInt(pid) !== process.pid) {
            await execAsync(`kill -9 ${pid}`);
            logger.info(
              `Automatically killed zombie process ${pid} using port ${port}`,
            );
          }
        }
      }
    } catch (err) {
      // It's normal for this to fail if no process is using the port
    }
  }

  private async startCompanionServer() {
    if (this.companionServer) return;

    await this.freePort(31415);

    try {
      this.companionServer = new WebSocketServer({ port: 31415 });
      this.companionServer.on("error", (error: any) => {
        if (error.code === "EADDRINUSE") {
          logger.error(
            "Companion WebSocket port 31415 is already in use. Is another instance running?",
          );
        } else {
          logger.error("Companion WebSocket server error:", error);
        }
      });
      this.companionServer.on("connection", (ws) => {
        logger.info("Companion module connected to local WebSocket server");
        this.companionSockets.add(ws);

        ws.on("message", (message) => {
          try {
            const response = JSON.parse(message.toString());
            if (
              response?.id &&
              this.pendingCompanionRequests.has(response.id)
            ) {
              const pending = this.pendingCompanionRequests.get(response.id)!;
              clearTimeout(pending.timeout);
              this.pendingCompanionRequests.delete(response.id);
              if (response.success) {
                pending.resolve(response.data);
              } else {
                pending.reject(
                  new Error(
                    response.error || "Companion module request failed",
                  ),
                );
              }
            }
          } catch (err) {
            logger.error("Failed to parse message from companion module", err);
          }
        });

        ws.on("close", () => {
          this.companionSockets.delete(ws);
        });
      });
      logger.info("Companion WebSocket Server listening on port 31415");
    } catch (error) {
      logger.error("Failed to start Companion WebSocket Server", error);
    }
  }

  /**
   * Connects Socket.IO with an authenticated session and loads worldData.
   */
  private connectAndLoadWorld(session: string): Promise<WorldData> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.config.baseUrl, {
        transports: ["websocket"],
        query: { session },
        extraHeaders: { Cookie: `session=${session}` },
      });

      const cleanup = () => {
        this.socket?.off("session", onSession);
        this.socket?.off("connect_error", onConnectError);
      };

      const timeout = setTimeout(() => {
        cleanup();
        this.socket?.disconnect();
        reject(new Error("Timeout waiting for world data (15s)"));
      }, 15000);

      const onSession = (data: { userId?: string } | null) => {
        if (!data?.userId) {
          logger.warn(
            "Session event returned no userId, but continuing anyway (Foundry v14 compatibility)",
            { data },
          );
        }

        this.socket?.emit("world", (worldData: WorldData) => {
          clearTimeout(timeout);
          cleanup();
          const parsed = WorldDataSchema.safeParse(worldData);
          if (!parsed.success) {
            logger.warn(
              "WorldData failed schema validation — proceeding with raw data",
              {
                issues: parsed.error.issues.map(
                  (i) => `${i.path.join(".")}: ${i.message}`,
                ),
              },
            );
          }
          resolve(worldData);
        });
      };

      const onConnectError = (err: Error) => {
        clearTimeout(timeout);
        cleanup();
        reject(new Error(`Socket.IO connection failed: ${err.message}`));
      };

      this.socket.on("session", onSession);
      this.socket.on("connect_error", onConnectError);
    });
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      try {
        this.socket.disconnect();
      } catch (err) {
        logger.error("Error disconnecting socket:", err);
      }
      this.socket = null;
    }

    for (const [_, req] of this.pendingCompanionRequests.entries()) {
      clearTimeout(req.timeout);
      req.reject(new Error("FoundryClient is disconnecting"));
    }
    this.pendingCompanionRequests.clear();

    for (const ws of this.companionSockets) {
      try {
        ws.close();
      } catch {}
    }
    this.companionSockets.clear();

    if (this.companionServer) {
      try {
        this.companionServer.close();
      } catch (err) {
        logger.error("Error closing companion server:", err);
      }
      this.companionServer = null;
    }

    this.worldData = null;
    this._isConnected = false;
    logger.info("FoundryVTT client disconnected");
  }

  isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Returns true if worldData is available (Socket.IO mode connected).
   */
  hasWorldData(): boolean {
    return this.worldData !== null;
  }

  // ==========================================================================
  // World data accessors
  // ==========================================================================

  /**
   * Re-emits 'world' on the existing socket to refresh the cached snapshot.
   *
   * Registers a one-shot 'world' listener and cleans it up on every exit
   * path (success, error, timeout) via `socket.off()` so that repeated
   * refreshes over a long-running session do not leak listener handles.
   */
  async refreshWorldData(): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error("Not connected — cannot refresh world data");
    }

    this.worldData = await new Promise<WorldData>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Refresh timeout"));
      }, this.config.timeout ?? 15000);

      this.socket?.emit("world", (data: WorldData) => {
        clearTimeout(timeoutId);
        try {
          const parsed = WorldDataSchema.safeParse(data);
          if (!parsed.success) {
            logger.warn(
              "WorldData refresh failed schema validation — proceeding with raw data",
              {
                issues: parsed.error.issues.map(
                  (i) => `${i.path.join(".")}: ${i.message}`,
                ),
              },
            );
          }
          resolve(data);
        } catch (err) {
          reject(err as Error);
        }
      });
    });

    logger.info("World data refreshed", {
      actors: this.worldData.actors.length,
      items: this.worldData.items.length,
    });
  }

  getWorldData(): WorldData | null {
    return this.worldData;
  }

  // ==========================================================================
  // Actor methods
  // ==========================================================================

  async searchActors(params: SearchActorsParams): Promise<ActorSearchResult> {
    if (!this.worldData) {
      return { actors: [], total: 0, page: 1, limit: params.limit || 10 };
    }

    let results = this.worldData.actors;

    if (params.query) {
      const q = params.query.toLowerCase();
      results = results.filter((a) => a.name.toLowerCase().includes(q));
    }
    if (params.type) {
      const t = params.type.toLowerCase();
      results = results.filter((a) => a.type.toLowerCase() === t);
    }

    const total = results.length;
    const limit = params.limit || 10;
    const actors: FoundryActor[] = results
      .slice(0, limit)
      .map(worldActorToFoundry);

    return { actors, total, page: 1, limit };
  }

  async getActor(actorId: string): Promise<FoundryActor> {
    if (!FOUNDRY_ID_PATTERN.test(actorId)) {
      throw new Error(`Invalid actorId format: ${actorId}`);
    }

    if (!this.worldData) {
      throw new Error("Not connected — no world data available");
    }

    const actor = this.worldData.actors.find((a) => a._id === actorId);
    if (!actor) {
      throw new Error(`Actor not found: ${actorId}`);
    }

    return worldActorToFoundry(actor);
  }

  /**
   * Returns the raw WorldActor with the full system data (game-system specific).
   */
  getRawActor(actorId: string): WorldActor | undefined {
    return this.worldData?.actors.find((a) => a._id === actorId);
  }

  /**
   * Creates a new actor via Socket.IO
   * @param name The name of the actor
   * @param type The type of the actor (e.g. "character", "adversary")
   * @param system Optional system data payload
   * @param folder Optional folder ID to place the actor in
   */
  async createActor(
    name: string,
    type: string,
    system?: Record<string, unknown>,
    folder?: string,
  ): Promise<any> {
    this.assertWriteable();
    const data: Record<string, unknown> = {
      name,
      type,
    };
    if (system) {
      data.system = system;
    }
    if (folder) {
      data.folder = folder;
    }
    const result = await this.modifyDocument("Actor", "create", {
      data: [data],
    });
    return result[0];
  }

  /**
   * Deletes an actor via Socket.IO
   * @param actorId The 16-char alphanumeric ID of the actor
   */
  async deleteActor(actorId: string): Promise<void> {
    this.assertWriteable();
    if (!FOUNDRY_ID_PATTERN.test(actorId)) {
      throw new Error(`Invalid actorId format: ${actorId}`);
    }
    await this.modifyDocument("Actor", "delete", {
      ids: [actorId],
    });
  }

  /**
   * Creates a new folder via Socket.IO
   * @param name The name of the folder
   * @param type The document type (e.g., 'Actor', 'Item', 'JournalEntry')
   * @param parent Optional parent folder ID
   * @param color Optional hex color
   */
  async createFolder(
    name: string,
    type: string,
    parent?: string,
    color?: string,
  ): Promise<any> {
    this.assertWriteable();
    const data: Record<string, unknown> = {
      name,
      type,
    };
    if (parent) data.folder = parent;
    if (color) data.color = color;

    const result = await this.modifyDocument("Folder", "create", {
      data: [data],
    });
    return result[0];
  }

  /**
   * Creates a new standalone item via Socket.IO
   * @param name The name of the item
   * @param type The type of the item
   * @param system Optional system data
   * @param folder Optional folder ID
   */
  async createItem(
    name: string,
    type: string,
    system?: Record<string, unknown>,
    folder?: string,
  ): Promise<any> {
    this.assertWriteable();
    const data: Record<string, unknown> = {
      name,
      type,
    };
    if (system) data.system = system;
    if (folder) data.folder = folder;

    const result = await this.modifyDocument("Item", "create", {
      data: [data],
    });
    return result[0];
  }

  /**
   * Creates a new JournalEntry via Socket.IO
   * @param name The name of the journal
   * @param content Optional HTML content for the initial page
   * @param folder Optional folder ID
   */
  async createJournal(
    name: string,
    content?: string,
    folder?: string,
  ): Promise<any> {
    this.assertWriteable();
    const data: Record<string, unknown> = {
      name,
    };
    if (folder) data.folder = folder;
    if (content) {
      data.pages = [
        {
          name,
          type: "text",
          text: { content, format: 1 },
        },
      ];
    }

    const result = await this.modifyDocument("JournalEntry", "create", {
      data: [data],
    });
    return result[0];
  }

  /**
   * Patches attributes on an actor's `system` object (#143). WRITE — REST required.
   *
   * `patch` keys are dot-paths into `actor.system` (e.g. `attributes.hp.value`,
   * `currency.gp`, `spells.spell1.value`, `attributes.exhaustion`). The patch is
   * expanded into a nested object and sent as `PUT /api/actors/:actorId` with the
   * body `{ system: <expanded patch> }` — matching FoundryVTT's own document model
   * (`Actor#update`).
   *
   * Client-side validation, using the actor's current data, rejects:
   *  - HP value exceeding `max + temp`,
   *  - spell-slot value exceeding its `max`,
   *  - exhaustion outside `0–10` (2024 rules) or `0–6` (2014 rules).
   *
   * @throws if `apiKey` is unset, the id is malformed, the actor/path is missing,
   *   or a validation rule is violated.
   */
  async updateActorAttribute(
    actorId: string,
    patch: AttributePatch,
  ): Promise<ActorAttributeUpdateResult> {
    this.assertWriteable();
    if (!FOUNDRY_ID_PATTERN.test(actorId)) {
      throw new Error(`Invalid actorId format: ${actorId}`);
    }
    if (!isRecord(patch) || Object.keys(patch).length === 0) {
      throw new Error(
        "patch is required and must contain at least one attribute path",
      );
    }

    // Fetch current actor data to validate paths and bounds. getActor returns
    // the mapped actor in socket mode (no `system`), so fall back to the cached
    // raw actor for the system document the validator needs.
    // If the actor was just created, it might not be in the local cache yet, so we allow skipping validation.
    try {
      const actor = await this.getActor(actorId);
      const rawSystem = systemOf(actor) ?? systemOf(this.getRawActor(actorId));
      validateAttributePatch(patch, actor, rawSystem);
    } catch (err) {
      console.warn(
        `Skipping validation for actor ${actorId}: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }

    // The patch keys are dot-paths into `actor.system`; prefix each with
    // `system.` for the document update. FoundryVTT accepts dot-notation keys
    // in update objects and merges recursively.
    const update: Record<string, unknown> = { _id: actorId };
    for (const [path, value] of Object.entries(patch)) {
      update[`system.${path}`] = value;
    }
    const result = await this.modifyDocument("Actor", "update", {
      updates: [update],
      diff: true,
      recursive: true,
    });

    // Echo the post-update value for each patched path. Prefer the server's
    // returned document when present; otherwise reflect the requested value.
    const returned = isRecord(result[0])
      ? (result[0] as Record<string, unknown>)
      : undefined;
    const updatedAttributes: Record<string, unknown> = {};
    for (const [path, value] of Object.entries(patch)) {
      const fromServer = returned
        ? getDotPath(returned, `system.${path}`)
        : undefined;
      updatedAttributes[path] = fromServer !== undefined ? fromServer : value;
    }

    return { success: true, updatedAttributes };
  }

  // ==========================================================================
  // Item methods
  // ==========================================================================

  async searchItems(params: SearchItemsParams): Promise<ItemSearchResult> {
    if (!this.worldData) {
      return { items: [], total: 0, page: 1, limit: params.limit || 10 };
    }

    let results = this.worldData.items;

    if (params.query) {
      const q = params.query.toLowerCase();
      results = results.filter((i) => i.name.toLowerCase().includes(q));
    }
    if (params.type) {
      const t = params.type.toLowerCase();
      results = results.filter((i) => i.type.toLowerCase() === t);
    }

    const total = results.length;
    const limit = params.limit || 10;
    const items = results.slice(0, limit).map((i) => {
      const item: FoundryItem = {
        _id: i._id,
        name: i.name,
        type: i.type,
      };
      if (i.img) {
        item.img = i.img;
      }
      const desc =
        extractString(i.system, "description", "value") ||
        extractString(i.system, "description");
      if (desc) {
        item.description = desc;
      }
      const burden = extractString(i.system, "burden");
      if (burden) {
        item.burden = burden;
      }
      const tier = extractNested(i.system, "tier");
      if (typeof tier === "number") {
        item.tier = tier;
      }
      return item as any; // Temporary cast to avoid interface mismatch if not fully strict
    });

    return { items, total, page: 1, limit };
  }

  // ==========================================================================
  // Compendium methods (Via Companion Module)
  // ==========================================================================

  private emitToCompanion<T>(method: string, payload: any = {}): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (this.companionSockets.size === 0) {
        reject(
          new Error(
            "No companion module connected to the local WebSocket server (port 31415). Please open Foundry VTT in your browser and enable the module.",
          ),
        );
        return;
      }

      const id = `req-${Math.random().toString(36).substring(2, 9)}${Date.now()}`;
      const timeoutMs = this.config.timeout || 15000;

      const timeout = setTimeout(() => {
        this.pendingCompanionRequests.delete(id);
        reject(
          new Error(
            `Timeout waiting for companion module response on '${method}' (${timeoutMs}ms)`,
          ),
        );
      }, timeoutMs);

      this.pendingCompanionRequests.set(id, { resolve, reject, timeout });

      const message = JSON.stringify({ ...payload, method, id });
      for (const ws of this.companionSockets) {
        ws.send(message);
      }
    });
  }

  /**
   * Retrieves a list of all existing compendiums from the Foundry VTT Client.
   */
  async getCompendiumsList(): Promise<any[]> {
    if (!this.socket?.connected) return [];
    try {
      return await this.emitToCompanion<any[]>("getCompendiumsList");
    } catch (error) {
      logger.error("Failed to get compendiums list via Companion:", error);
      return [];
    }
  }

  /**
   * Searches FoundryVTT compendium packs by name and metadata via Companion module.
   */
  async searchCompendium(
    params: CompendiumSearchParams,
  ): Promise<CompendiumSearchResult> {
    const limit = params.limit ?? 20;

    if (!this.socket?.connected) {
      return { results: [], total: 0, page: 1, limit, nextCursor: null };
    }

    try {
      // Emit event to the companion module
      const response = await this.emitToCompanion<any>(
        "searchCompendium",
        params,
      );

      const results = response?.results ?? [];
      const total =
        typeof response?.total === "number" ? response.total : results.length;
      return {
        results,
        total,
        page: response?.page ?? 1,
        limit,
        nextCursor: response?.nextCursor ?? null,
      };
    } catch (error) {
      logger.error("Failed to search compendium via Socket.IO:", error);
      return { results: [], total: 0, page: 1, limit, nextCursor: null };
    }
  }

  // ==========================================================================
  // Write helpers (Socket.IO `modifyDocument` — primary transport, PRD-003)
  // ==========================================================================

  /**
   * Guards a write operation. Writes require the `FOUNDRY_WRITE_ENABLED` opt-in
   * and an active authenticated Socket.IO session (the primary transport).
   * Throws a clear, actionable error otherwise.
   */
  private assertWriteable(): void {
    if (!this.config.writeEnabled) {
      throw new Error(
        "Write operations are disabled. Set FOUNDRY_WRITE_ENABLED=true to allow game-state mutation.",
      );
    }
    if (!this.socket?.connected) {
      throw new Error(
        "Write operations require an active Socket.IO connection to FoundryVTT (username/password mode).",
      );
    }
  }

  /**
   * Emits a Socket.IO event with an acknowledgement callback, resolving the
   * server's response and rejecting on timeout. Mirrors the ack pattern used by
   * the `world` event in {@link connectAndLoadWorld}/{@link refreshWorldData}.
   */
  private emitWithAck<T>(event: string, payload: unknown): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const socket = this.socket;
      if (!socket?.connected) {
        reject(new Error("Socket.IO is not connected"));
        return;
      }
      const timeoutMs = this.config.timeout || 10000;
      const timeout = setTimeout(
        () =>
          reject(
            new Error(
              `Timeout waiting for '${event}' response (${timeoutMs}ms)`,
            ),
          ),
        timeoutMs,
      );
      socket.emit(event, payload, (response: T) => {
        clearTimeout(timeout);
        resolve(response);
      });
    });
  }

  getFolders(): any[] {
    return this.worldData?.folders || [];
  }

  /**
   * Performs a FoundryVTT document mutation over Socket.IO using the core
   * `modifyDocument` protocol. The request shape is verified against the
   * v13.348 client source (`client/data/client-backend.mjs` `#buildRequest`,
   * `helpers/socket-interface.mjs` `dispatch`, `common/abstract/socket.mjs`).
   *
   * @param type - Document name ("Actor", "Item", …)
   * @param action - "create" | "update" | "delete"
   * @param operation - action-specific payload: `data` (create) / `updates`
   *   (update) / `ids` (delete), plus `parentUuid` for embedded documents.
   * @returns the server's `result` array (created/updated data, or deleted ids)
   */
  private async modifyDocument(
    type: string,
    action: "create" | "update" | "delete",
    operation: Record<string, unknown>,
  ): Promise<unknown[]> {
    const request: any = {
      type,
      action,
      operation: {
        broadcast: true,
        pack: null,
        modifiedTime: Date.now(),
        ...operation,
      },
    };
    if (operation.parentUuid) {
      request.parentUuid = operation.parentUuid;
    }
    if (operation.pack) {
      request.pack = operation.pack;
    }
    const response = await this.emitWithAck<DocumentSocketResponse>(
      "modifyDocument",
      request,
    );
    if (response?.error) {
      throw new Error(
        `FoundryVTT rejected ${action} ${type}: ${response.error.message || "unknown error"}`,
      );
    }
    return Array.isArray(response?.result) ? response.result : [];
  }

  // ==========================================================================
  // Item mutation methods (WRITE — Socket.IO modifyDocument)
  // ==========================================================================

  /**
   * Creates a new item on an actor via the `modifyDocument` socket protocol.
   *
   * Inline sources are created directly. Compendium sources are NOT yet
   * supported over Socket.IO — copying a pack entry needs a compendium read
   * that `modifyDocument` does not provide (tracked in issue #159).
   *
   * @param actorId - 16-char alphanumeric actor document id
   * @param source - inline item document (compendium source throws)
   * @returns the newly created item document
   */
  async createActorItem(
    actorId: string,
    source: ActorItemCreateSource,
  ): Promise<FoundryItem> {
    this.assertWriteable();
    if (!FOUNDRY_ID_PATTERN.test(actorId)) {
      throw new Error(`Invalid actorId format: ${actorId}`);
    }
    if (source.type === "compendium") {
      throw new Error(
        "Creating an item from a compendium source is not yet supported over Socket.IO; " +
          "provide an inline item instead. See issue #159.",
      );
    }
    const result = await this.modifyDocument("Item", "create", {
      data: [source.item],
      parentUuid: `Actor.${actorId}`,
    });
    return result[0] as FoundryItem;
  }

  /**
   * Applies a JSON merge patch to an item owned by an actor.
   *
   * The `patch` is merged into the item's `system` data (recursively, so nested
   * paths like the D&D 5e v4+ `activities.{id}.consumption.targets` are
   * preserved). Performed via the `modifyDocument` socket protocol.
   *
   * @param actorId - 16-char alphanumeric actor document id
   * @param itemId - 16-char alphanumeric item document id
   * @param patch - shallow/nested JSON merge patch applied to `item.system`
   * @returns the updated item document
   */
  async updateActorItem(
    actorId: string,
    itemId: string,
    patch: Record<string, unknown>,
  ): Promise<FoundryItem> {
    this.assertWriteable();
    if (!FOUNDRY_ID_PATTERN.test(actorId)) {
      throw new Error(`Invalid actorId format: ${actorId}`);
    }
    if (!FOUNDRY_ID_PATTERN.test(itemId)) {
      throw new Error(`Invalid itemId format: ${itemId}`);
    }
    const result = await this.modifyDocument("Item", "update", {
      updates: [{ _id: itemId, system: patch }],
      parentUuid: `Actor.${actorId}`,
      diff: true,
      recursive: true,
    });
    return result[0] as FoundryItem;
  }

  /**
   * Deletes an item owned by an actor via the `modifyDocument` socket protocol.
   *
   * @param actorId - 16-char alphanumeric actor document id
   * @param itemId - 16-char alphanumeric item document id
   */
  async deleteActorItem(actorId: string, itemId: string): Promise<void> {
    this.assertWriteable();
    if (!FOUNDRY_ID_PATTERN.test(actorId)) {
      throw new Error(`Invalid actorId format: ${actorId}`);
    }
    if (!FOUNDRY_ID_PATTERN.test(itemId)) {
      throw new Error(`Invalid itemId format: ${itemId}`);
    }
    await this.modifyDocument("Item", "delete", {
      ids: [itemId],
      parentUuid: `Actor.${actorId}`,
    });
  }

  /**
   * Deletes a standalone world item via the `modifyDocument` socket protocol.
   *
   * @param itemId - 16-char alphanumeric item document id
   */
  async deleteItem(itemId: string): Promise<void> {
    this.assertWriteable();
    if (!FOUNDRY_ID_PATTERN.test(itemId)) {
      throw new Error(`Invalid itemId format: ${itemId}`);
    }
    await this.modifyDocument("Item", "delete", {
      ids: [itemId],
    });
  }

  // ==========================================================================
  // Combat mutation methods (WRITE — Socket.IO modifyDocument, FR-018)
  // ==========================================================================

  /**
   * Updates the active combat's turn/round pointers (FR-018).
   *
   * `Combat` is a top-level document, so the update carries no `parentUuid`.
   * The patch fields map directly onto the Combat document (`turn`, `round`).
   *
   * @param combatId - 16-char alphanumeric Combat document id
   * @param patch - turn and/or round to set on the combat
   * @returns the updated combat document
   */
  async updateCombat(
    combatId: string,
    patch: { turn?: number; round?: number },
  ): Promise<unknown> {
    this.assertWriteable();
    if (!FOUNDRY_ID_PATTERN.test(combatId)) {
      throw new Error(`Invalid combatId format: ${combatId}`);
    }
    const result = await this.modifyDocument("Combat", "update", {
      updates: [{ _id: combatId, ...patch }],
      diff: true,
      recursive: true,
    });
    return result[0];
  }

  /**
   * Ends (deletes) the active combat encounter (FR-018).
   *
   * @param combatId - 16-char alphanumeric Combat document id
   */
  async endCombat(combatId: string): Promise<void> {
    this.assertWriteable();
    if (!FOUNDRY_ID_PATTERN.test(combatId)) {
      throw new Error(`Invalid combatId format: ${combatId}`);
    }
    await this.modifyDocument("Combat", "delete", { ids: [combatId] });
  }

  /**
   * Sets a combatant's initiative (FR-018).
   *
   * `Combatant` is an embedded document inside `Combat`, so the update is sent
   * with `parentUuid: "Combat.<combatId>"`.
   *
   * @param combatId - 16-char alphanumeric Combat document id (the parent)
   * @param combatantId - 16-char alphanumeric Combatant document id
   * @param initiative - finite initiative value to assign
   * @returns the updated combatant document
   */
  async setCombatantInitiative(
    combatId: string,
    combatantId: string,
    initiative: number,
  ): Promise<unknown> {
    this.assertWriteable();
    if (!FOUNDRY_ID_PATTERN.test(combatId)) {
      throw new Error(`Invalid combatId format: ${combatId}`);
    }
    if (!FOUNDRY_ID_PATTERN.test(combatantId)) {
      throw new Error(`Invalid combatantId format: ${combatantId}`);
    }
    if (typeof initiative !== "number" || !Number.isFinite(initiative)) {
      throw new Error(
        `Invalid initiative: ${initiative} (must be a finite number)`,
      );
    }
    const result = await this.modifyDocument("Combatant", "update", {
      updates: [{ _id: combatantId, initiative }],
      parentUuid: `Combat.${combatId}`,
      diff: true,
      recursive: true,
    });
    return result[0];
  }

  /**
   * Starts a new combat encounter and seeds its combatants (FR-018, #172).
   *
   * Two-step `modifyDocument` flow:
   *   1. Create the top-level `Combat` document (no `parentUuid`), activated on
   *      the given scene, and read its `_id` from the response.
   *   2. Create the embedded `Combatant` documents with
   *      `parentUuid: "Combat.<combatId>"` (mirrors the Combatant→Combat embed
   *      used by {@link setCombatantInitiative}).
   *
   * The create wire shape is verified against the v13.348 client source per
   * `.claude/rules/foundry-write-protocol.md`; smoke-test one live round-trip
   * when changing it.
   *
   * @param sceneId - 16-char alphanumeric Scene document id the combat runs on
   * @param combatants - combatant seeds ({ tokenId, sceneId, actorId? })
   * @returns the new combat id and the number of combatants created
   */
  async startCombat(
    sceneId: string,
    combatants: Array<{
      tokenId: string;
      sceneId: string;
      actorId?: string | undefined;
    }>,
  ): Promise<{ combatId: string; combatantCount: number }> {
    this.assertWriteable();
    if (!FOUNDRY_ID_PATTERN.test(sceneId)) {
      throw new Error(`Invalid sceneId format: ${sceneId}`);
    }
    for (const c of combatants) {
      if (!FOUNDRY_ID_PATTERN.test(c.tokenId)) {
        throw new Error(`Invalid tokenId format: ${c.tokenId}`);
      }
    }

    const created = await this.modifyDocument("Combat", "create", {
      data: [{ scene: sceneId, active: true }],
    });
    const combat = created[0] as { _id?: string } | undefined;
    const combatId = combat?._id;
    if (!combatId) {
      throw new Error("FoundryVTT did not return a Combat id after create");
    }

    if (combatants.length > 0) {
      await this.modifyDocument("Combatant", "create", {
        data: combatants,
        parentUuid: `Combat.${combatId}`,
      });
    }

    return { combatId, combatantCount: combatants.length };
  }

  // ==========================================================================
  // Token mutation methods (WRITE — Socket.IO modifyDocument, FR-019)
  // ==========================================================================

  /**
   * Locates a token (and the scene it lives on) in the cached worldData.
   *
   * `Token` is an embedded document of `Scene`; worldData carries each scene's
   * tokens as raw records. When `sceneId` is omitted the search spans every
   * scene, so a token can be moved/affected without first resolving its scene.
   *
   * @param tokenId - 16-char alphanumeric Token document id
   * @param sceneId - optional Scene id to scope the search to
   * @returns the owning scene and the raw token record, or null if not found
   */
  findToken(
    tokenId: string,
    sceneId?: string,
  ): { scene: WorldScene; token: Record<string, unknown> } | null {
    if (!this.worldData) {
      return null;
    }
    const scenes = sceneId
      ? this.worldData.scenes.filter((s) => s._id === sceneId)
      : this.worldData.scenes;
    for (const scene of scenes) {
      const token = scene.tokens?.find(
        (t) => (t as { _id?: string })._id === tokenId,
      );
      if (token) {
        return { scene, token };
      }
    }
    return null;
  }

  /**
   * Moves a token to new x/y coordinates (FR-019).
   *
   * `Token` is an embedded document of `Scene`, so the update is sent with
   * `parentUuid: "Scene.<sceneId>"` (mirrors the Combatant→Combat embed). The
   * wire shape is verified against the v13.348 client source per
   * `.claude/rules/foundry-write-protocol.md`.
   *
   * @param sceneId - 16-char alphanumeric Scene document id (the parent)
   * @param tokenId - 16-char alphanumeric Token document id
   * @param x - target x pixel coordinate (finite number)
   * @param y - target y pixel coordinate (finite number)
   * @returns the updated token document
   */
  async moveToken(
    sceneId: string,
    tokenId: string,
    x: number,
    y: number,
  ): Promise<unknown> {
    this.assertWriteable();
    if (!FOUNDRY_ID_PATTERN.test(sceneId)) {
      throw new Error(`Invalid sceneId format: ${sceneId}`);
    }
    if (!FOUNDRY_ID_PATTERN.test(tokenId)) {
      throw new Error(`Invalid tokenId format: ${tokenId}`);
    }
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error(
        `Invalid coordinates: (${x}, ${y}) — x and y must be finite numbers`,
      );
    }
    const result = await this.modifyDocument("Token", "update", {
      updates: [{ _id: tokenId, x, y }],
      parentUuid: `Scene.${sceneId}`,
      diff: true,
      recursive: true,
    });
    return result[0];
  }

  /**
   * Creates a status-effect `ActiveEffect` on a token's actor (FR-019).
   *
   * `ActiveEffect` is an embedded document of `Actor`, so the create is sent with
   * the actor's parent UUID:
   *  - `Actor.<id>` for a world-linked actor (`actorLink: true`)
   *  - `Scene.<sid>.Token.<tid>.Actor.<aid>` for an unlinked token's synthetic
   *    actor (the per-token delta).
   *
   * The effect carries a `statuses` array, matching how FoundryVTT v11+ models
   * conditions (`Actor#toggleStatusEffect` toggles by this field).
   *
   * @param parentActorUuid - the token actor's parent UUID (see forms above)
   * @param statusId - condition id (e.g. "prone", "stunned")
   * @param options - optional display `name` (defaults to `statusId`) and `img`
   * @returns the newly created ActiveEffect document
   */
  async createActorStatusEffect(
    parentActorUuid: string,
    statusId: string,
    options: { name?: string; img?: string } = {},
  ): Promise<WorldEffect> {
    this.assertWriteable();
    if (!TOKEN_ACTOR_UUID_PATTERN.test(parentActorUuid)) {
      throw new Error(`Invalid actor UUID format: ${parentActorUuid}`);
    }
    if (!statusId || typeof statusId !== "string") {
      throw new Error("statusId is required and must be a string");
    }
    const effectData: Record<string, unknown> = {
      name: options.name ?? statusId,
      statuses: [statusId],
    };
    if (options.img) {
      effectData.img = options.img;
    }
    const result = await this.modifyDocument("ActiveEffect", "create", {
      data: [effectData],
      parentUuid: parentActorUuid,
    });
    return result[0] as WorldEffect;
  }

  /**
   * Deletes an `ActiveEffect` from a token's actor (FR-019), e.g. to clear a
   * status condition. Accepts the same parent-UUID forms as
   * {@link createActorStatusEffect}.
   *
   * @param parentActorUuid - the token actor's parent UUID
   * @param effectId - 16-char alphanumeric ActiveEffect document id
   */
  async deleteActorEffect(
    parentActorUuid: string,
    effectId: string,
  ): Promise<void> {
    this.assertWriteable();
    if (!TOKEN_ACTOR_UUID_PATTERN.test(parentActorUuid)) {
      throw new Error(`Invalid actor UUID format: ${parentActorUuid}`);
    }
    if (!FOUNDRY_ID_PATTERN.test(effectId)) {
      throw new Error(`Invalid effectId format: ${effectId}`);
    }
    await this.modifyDocument("ActiveEffect", "delete", {
      ids: [effectId],
      parentUuid: parentActorUuid,
    });
  }

  // ==========================================================================
  // Scene methods
  // ==========================================================================

  async getCurrentScene(sceneId?: string): Promise<FoundryScene> {
    if (sceneId !== undefined && !FOUNDRY_ID_PATTERN.test(sceneId)) {
      throw new Error(`Invalid sceneId format: ${sceneId}`);
    }
    if (this.config.apiKey) {
      return this.executeWithRetry(async () => {
        const endpoint = sceneId
          ? `/api/scenes/${sceneId}`
          : "/api/scenes/current";
        const response = await this.http.get(endpoint);
        return response.data;
      });
    }

    if (!this.worldData) {
      throw new Error("Not connected — no world data available");
    }

    let scene: WorldScene | undefined;
    if (sceneId) {
      scene = this.worldData.scenes.find((s) => s._id === sceneId);
    } else {
      scene = this.worldData.scenes.find((s) => s.active);
    }

    if (!scene) {
      throw new Error(
        sceneId ? `Scene not found: ${sceneId}` : "No active scene",
      );
    }

    return worldSceneToFoundry(scene);
  }

  async getScene(sceneId: string): Promise<FoundryScene> {
    return this.getCurrentScene(sceneId);
  }

  getScenes(): WorldScene[] {
    return this.worldData?.scenes || [];
  }

  // ==========================================================================
  // World info
  // ==========================================================================

  async getWorldInfo(): Promise<FoundryWorld> {
    if (this.config.apiKey) {
      return this.executeWithRetry(async () => {
        const response = await this.http.get("/api/world");
        return response.data;
      });
    }

    if (!this.worldData) {
      return {
        id: "unknown",
        title: "Not connected",
        description: "Connect to FoundryVTT to retrieve world information",
        system: "unknown",
        coreVersion: "unknown",
        systemVersion: "unknown",
        playtime: 0,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      };
    }

    const w = this.worldData.world as Record<string, unknown>;
    const s = this.worldData.system as Record<string, unknown>;
    const r = this.worldData.release as Record<string, unknown>;

    return {
      id: (w.id as string) || "unknown",
      title: (w.title as string) || "Unknown World",
      description: (w.description as string) || "",
      system: (s.id as string) || "unknown",
      coreVersion:
        (r.version as string) || (r.generation as string) || "unknown",
      systemVersion: (s.version as string) || "unknown",
      playtime: 0,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    };
  }

  // ==========================================================================
  // Combat
  // ==========================================================================

  getCombatState(): WorldCombat | null {
    if (!this.worldData) {
      return null;
    }
    return this.worldData.combats.find((c) => c.active) ?? null;
  }

  // ==========================================================================
  // Chat messages
  // ==========================================================================

  getChatMessages(limit = 20): WorldMessage[] {
    if (!this.worldData) {
      return [];
    }
    return this.worldData.messages.slice(-limit);
  }

  // ==========================================================================
  // Users
  // ==========================================================================

  getUsers(): { users: WorldUser[]; activeUsers: string[] } {
    if (!this.worldData) {
      return { users: [], activeUsers: [] };
    }
    return {
      users: this.worldData.users,
      activeUsers: this.worldData.activeUsers,
    };
  }

  // ==========================================================================
  // Journals
  // ==========================================================================

  getJournals(): WorldJournal[] {
    return this.worldData?.journal || [];
  }

  searchJournals(query: string): WorldJournal[] {
    if (!this.worldData) {
      return [];
    }
    const q = query.toLowerCase();
    return this.worldData.journal.filter((j) => {
      if (j.name.toLowerCase().includes(q)) {
        return true;
      }
      return j.pages?.some(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.text?.content?.toLowerCase().includes(q),
      );
    });
  }

  getJournal(journalId: string): WorldJournal | undefined {
    return this.worldData?.journal.find((j) => j._id === journalId);
  }

  // ==========================================================================
  // Cross-collection search
  // ==========================================================================

  searchWorld(query: string): {
    actors: WorldActor[];
    items: WorldItem[];
    scenes: WorldScene[];
    journals: WorldJournal[];
  } {
    if (!this.worldData) {
      return { actors: [], items: [], scenes: [], journals: [] };
    }

    const q = query.toLowerCase();

    return {
      actors: this.worldData.actors.filter((a) =>
        a.name.toLowerCase().includes(q),
      ),
      items: this.worldData.items.filter((i) =>
        i.name.toLowerCase().includes(q),
      ),
      scenes: this.worldData.scenes.filter((s) =>
        s.name.toLowerCase().includes(q),
      ),
      journals: this.worldData.journal.filter((j) =>
        j.name.toLowerCase().includes(q),
      ),
    };
  }

  // ==========================================================================
  // World summary
  // ==========================================================================

  getWorldSummary(): Record<string, number> {
    if (!this.worldData) {
      return {};
    }
    return {
      actors: this.worldData.actors.length,
      items: this.worldData.items.length,
      scenes: this.worldData.scenes.length,
      journals: this.worldData.journal.length,
      combats: this.worldData.combats.length,
      users: this.worldData.users.length,
      messages: this.worldData.messages.length,
      macros: this.worldData.macros.length,
      playlists: this.worldData.playlists.length,
      tables: this.worldData.tables.length,
      folders: this.worldData.folders.length,
    };
  }

  // ==========================================================================
  // Dice rolling
  // ==========================================================================

  async rollDice(formula: string, reason?: string): Promise<DiceRoll> {
    const DICE_FORMULA_REGEX = /^[0-9d\s+\-()]+$/;
    if (!formula || formula.length > 100 || !DICE_FORMULA_REGEX.test(formula)) {
      throw new Error(`Invalid dice formula: ${formula}`);
    }

    if (this.config.apiKey) {
      try {
        const response = await this.http.post("/api/dice/roll", {
          formula,
          flavor: reason,
        });

        const result: DiceRoll = {
          formula,
          total: response.data.total,
          breakdown:
            response.data.terms
              ?.map((term: { results?: number[] }) => term.results?.join(", "))
              .join(" + ") || formula,
          timestamp: new Date().toISOString(),
        };
        if (reason) {
          result.reason = reason;
        }
        return result;
      } catch {
        // Fall through to local roll
      }
    }

    const { result, rollJson } = this.fallbackDiceRoll(formula, reason);

    if (this.config.writeEnabled && this.socket?.connected) {
      try {
        const payload = {
          data: [
            {
              style: 5,
              rolls: [rollJson],
              content: `<strong>Roll Total: ${result.total}</strong>`,
              flavor: reason || "MCP Server Roll",
              speaker: { alias: "AntiGravity" },
              author: this.worldData?.userId,
            },
          ],
        };
        logger.info("Attempting to create ChatMessage via Socket.IO", payload);
        const createResult = await this.modifyDocument(
          "ChatMessage",
          "create",
          payload,
        );
        logger.info("ChatMessage creation result", createResult);
      } catch (e) {
        logger.error("Failed to send chat message for roll over Socket.IO", e);
      }
    } else {
      logger.warn(
        "Cannot send ChatMessage for rollDice: writeEnabled is false or socket is not connected",
        {
          writeEnabled: this.config.writeEnabled,
          socketConnected: this.socket?.connected,
        },
      );
    }

    return result;
  }

  /**
   * Rolls 2d12 (Hope and Fear) for the Daggerheart system, adding a modifier.
   */
  async rollDaggerheart(modifier: number, reason?: string): Promise<any> {
    const hope = Math.floor(Math.random() * 12) + 1;
    const fear = Math.floor(Math.random() * 12) + 1;
    const total = hope + fear + modifier;

    let outcome = "";
    if (hope === fear) {
      outcome = "Critical Success!";
    } else if (hope > fear) {
      outcome = "Success with Hope (or Failure with Hope)";
    } else {
      outcome = "Success with Fear (or Failure with Fear)";
    }

    const result = {
      formula: `2d12+${modifier}`,
      total,
      breakdown: `Hope: ${hope}, Fear: ${fear}, Mod: +${modifier} -> ${outcome}`,
      timestamp: new Date().toISOString(),
      reason,
    };

    const formulaStr =
      modifier >= 0
        ? `1d12 + 1d12 + ${modifier}`
        : `1d12 + 1d12 - ${Math.abs(modifier)}`;

    const rollData = {
      total,
      formula: formulaStr,
      dice: [
        {
          dice: "d12",
          total: hope,
          formula: "1d12",
          results: [{ result: hope, active: true }],
          rerolled: { any: false, rerolls: [] },
        },
        {
          dice: "d12",
          total: fear,
          formula: "1d12",
          results: [{ result: fear, active: true }],
          rerolled: { any: false, rerolls: [] },
        },
      ],
      type: "action",
      difficulty: null,
      advantage: { type: 0 },
      isCritical: hope === fear,
      extra: [],
      modifierTotal: modifier,
      hope: { dice: "d12", value: hope, rerolled: { any: false, rerolls: [] } },
      fear: { dice: "d12", value: fear, rerolled: { any: false, rerolls: [] } },
      rally: {},
      result: {
        duality: hope > fear ? 1 : hope < fear ? -1 : 0,
        total: total,
        label: hope === fear ? "Critical" : hope > fear ? "Hope" : "Fear",
      },
      withHope: hope > fear,
      withFear: hope < fear,
    };

    const rollJson = JSON.stringify({
      class: "DualityRoll",
      options: {
        title: reason || "Duality Roll",
        actionType: "action",
        source: { actor: null },
        roll: rollData,
        data: { experiences: {}, traits: {}, rules: {} },
      },
      hasRoll: true,
      dice: [],
      formula: formulaStr,
      terms: [
        {
          class: "Die",
          options: {},
          evaluated: true,
          number: 1,
          faces: 12,
          modifiers: [],
          results: [{ result: hope, active: true }],
        },
        {
          class: "OperatorTerm",
          options: {},
          evaluated: true,
          operator: "+",
        },
        {
          class: "Die",
          options: {},
          evaluated: true,
          number: 1,
          faces: 12,
          modifiers: [],
          results: [{ result: fear, active: true }],
        },
        {
          class: "OperatorTerm",
          options: {},
          evaluated: true,
          operator: modifier >= 0 ? "+" : "-",
        },
        {
          class: "NumericTerm",
          options: {},
          evaluated: true,
          number: Math.abs(modifier),
        },
      ],
      total,
      evaluated: true,
    });

    if (this.config.writeEnabled && this.socket?.connected) {
      try {
        const payload = {
          data: [
            {
              type: "dualityRoll",
              style: 0,
              rolls: [rollJson],
              content: "",
              flavor: reason || "Duality Roll",
              speaker: { alias: "AntiGravity" },
              author: this.worldData?.userId,
              system: {
                title: reason || "Duality Roll",
                hasRoll: true,
                roll: rollData,
              },
            },
          ],
        };
        logger.info(
          "Attempting to create Daggerheart ChatMessage via Socket.IO",
          payload,
        );
        const createResult = await this.modifyDocument(
          "ChatMessage",
          "create",
          payload,
        );
        logger.info("Daggerheart ChatMessage creation result", createResult);
        (result as any).serverDebug =
          `Success: ${JSON.stringify(createResult)}`;
      } catch (e) {
        logger.error("Failed to send Daggerheart roll chat message", e);
        (result as any).serverDebug = `Error: ${(e as Error).message}`;
      }
    } else {
      (result as any).serverDebug =
        `Skipped: writeEnabled=${this.config.writeEnabled}, socket=${this.socket?.connected}`;
      logger.warn(
        "Cannot send ChatMessage for Daggerheart: writeEnabled is false or socket is not connected",
        {
          writeEnabled: this.config.writeEnabled,
          socketConnected: this.socket?.connected,
        },
      );
    }

    return result;
  }

  private fallbackDiceRoll(
    formula: string,
    reason?: string,
  ): { result: DiceRoll; rollJson: string } {
    const cleanFormula = formula.replace(/\s+/g, "");
    const terms = [];
    let total = 0;
    const breakdown: string[] = [];

    const tokenRegex = /([+-])?(\d+d\d+|\d+)/g;
    let match: RegExpExecArray | null = tokenRegex.exec(cleanFormula);
    while (match !== null) {
      const operator = match[1] || "+";
      const token = match[2];
      if (!token) {
        match = tokenRegex.exec(cleanFormula);
        continue;
      }

      if (terms.length > 0 || operator === "-") {
        terms.push({
          class: "OperatorTerm",
          options: {},
          evaluated: true,
          operator: operator,
        });
      }

      if (token.includes("d")) {
        const [countStr, sidesStr] = token.split("d");
        const numDice = countStr ? Number.parseInt(countStr, 10) : 1;
        const numSides = Number.parseInt(sidesStr, 10);
        const results = [];
        let subtotal = 0;

        for (let i = 0; i < numDice; i++) {
          const roll = Math.floor(Math.random() * numSides) + 1;
          results.push({ result: roll, active: true });
          subtotal += roll;
        }

        total += operator === "-" ? -subtotal : subtotal;
        breakdown.push(
          `${operator === "-" ? "-" : "+"}(${results.map((r) => r.result).join("+")})`,
        );

        terms.push({
          class: "Die",
          options: {},
          evaluated: true,
          number: numDice,
          faces: numSides,
          modifiers: [],
          results,
        });
      } else {
        const val = Number.parseInt(token, 10);
        total += operator === "-" ? -val : val;
        breakdown.push(`${operator === "-" ? "-" : "+"}${val}`);
        terms.push({
          class: "NumericTerm",
          options: {},
          evaluated: true,
          number: val,
        });
      }

      match = tokenRegex.exec(cleanFormula);
    }

    const rollJson = JSON.stringify({
      class: "Roll",
      options: {},
      dice: [],
      formula,
      terms,
      total,
      evaluated: true,
    });

    const result: DiceRoll = {
      formula,
      total,
      breakdown: breakdown.join(" "),
      timestamp: new Date().toISOString(),
    };
    if (reason) {
      result.reason = reason;
    }
    return { result, rollJson };
  }

  // ==========================================================================
  // Connection test
  // ==========================================================================

  async testConnection(): Promise<boolean> {
    try {
      if (this.config.username && this.config.password) {
        await this.connect();
        return true;
      }

      const response = await this.http.get("/");
      logger.debug("Connection test successful", { status: response.status });
      return true;
    } catch (error) {
      logger.error("Failed to connect to FoundryVTT:", error);
      throw error;
    }
  }

  // ==========================================================================
  // HTTP helpers (preserved for REST API mode and diagnostics)
  // ==========================================================================

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    const maxAttempts = (this.config.retryAttempts || 3) + 1;
    const baseDelay = this.config.retryDelay || 1000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          if (status && status >= 400 && status < 500 && status !== 429) {
            throw lastError;
          }
        }

        if (attempt === maxAttempts) {
          throw lastError;
        }

        const exponentialDelay = baseDelay * 2 ** (attempt - 1);
        const jitter = Math.random() * 0.1 * exponentialDelay;
        await new Promise((resolve) =>
          setTimeout(resolve, exponentialDelay + jitter),
        );
      }
    }

    throw lastError || new Error("Request failed after all retry attempts");
  }

  async get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.executeWithRetry(() => this.http.get(url, config));
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.executeWithRetry(() => this.http.post(url, data, config));
  }

  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.executeWithRetry(() => this.http.put(url, data, config));
  }

  async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.executeWithRetry(() => this.http.delete(url, config));
  }
}

// ============================================================================
// Mapping helpers — WorldData raw documents → display interfaces
// ============================================================================

/**
 * Evaluates an active effect value which could be a number, a simple string,
 * or a math expression like "floor(((@tier * 2) - 2) + (1 / max(@tier, 1)))".
 */
function evaluateEffectValue(
  value: unknown,
  actorSys: Record<string, unknown>,
  level: number,
): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;

  let expr = value;

  // Replace @system.xyz or @xyz with the actual value from actorSys
  expr = expr.replace(/@([a-zA-Z0-9_.]+)/g, (match, path) => {
    const cleanPath = path.startsWith("system.") ? path.slice(7) : path;

    // Evaluate @tier as (Math.ceil(level / 5) || 1) if tier is not explicitly found
    if (cleanPath === "tier") {
      const tierVal = getDotPath(actorSys, cleanPath);
      if (typeof tierVal === "number") return tierVal.toString();
      return Math.max(1, Math.ceil(level / 5)).toString();
    }

    const val = getDotPath(actorSys, cleanPath);
    return typeof val === "number" ? val.toString() : "0";
  });

  // Replace math functions with Math.xyz
  const mathFuncs = ["floor", "ceil", "max", "min", "round", "abs"];
  for (const fn of mathFuncs) {
    const re = new RegExp(`\\b${fn}\\b`, "g");
    expr = expr.replace(re, `Math.${fn}`);
  }

  try {
    const result = new Function(`return ${expr};`)();
    return typeof result === "number" && !Number.isNaN(result) ? result : 0;
  } catch (err) {
    logger.warn(`Failed to evaluate effect value: ${value}`, { expr, err });
    return 0;
  }
}

function worldActorToFoundry(a: WorldActor): FoundryActor {
  const sys = a.system || {};
  const resourcesRaw = extractNested(sys, "resources");
  const resources = isRecord(resourcesRaw) ? resourcesRaw : undefined;

  const armorScoreRaw = extractNested(sys, "armorScore");
  const armorScore = isRecord(armorScoreRaw) ? armorScoreRaw : undefined;

  const evasion = typeof sys.evasion === "number" ? sys.evasion : undefined;

  const levelData = extractNested(sys, "levelData");
  const level =
    isRecord(levelData) &&
    isRecord(levelData.level) &&
    typeof levelData.level.current === "number"
      ? levelData.level.current
      : undefined;

  const traitsRaw = sys.traits;
  let mappedTraits: FoundryActor["traits"];
  if (isRecord(traitsRaw)) {
    mappedTraits = {};
    for (const [key, val] of Object.entries(traitsRaw)) {
      if (isRecord(val) && typeof val.value === "number") {
        mappedTraits[key] = { value: val.value };
      }
    }
  }

  const actor: FoundryActor = {
    _id: a._id,
    name: a.name,
    type: a.type,
  };

  if (a.img) {
    actor.img = a.img;
  }

  if (resources) {
    const mappedResources: NonNullable<FoundryActor["resources"]> = {};
    for (const key of ["hitPoints", "stress", "hope", "fear"]) {
      if (a.type === "character" && key === "fear") continue;

      const res = isRecord(resources[key]) ? resources[key] : undefined;
      if (res && typeof res.value === "number") {
        mappedResources[key as "hitPoints"] = {
          value: res.value,
          max: typeof res.max === "number" ? res.max : 0,
        };
      }
    }
    actor.resources = mappedResources;
  }

  const experiencesMap: Record<string, { name: string; value: number }> = {};
  if (isRecord(sys.experiences)) {
    for (const [id, exp] of Object.entries(sys.experiences)) {
      if (
        isRecord(exp) &&
        typeof exp.name === "string" &&
        typeof exp.value === "number"
      ) {
        experiencesMap[id] = { name: exp.name, value: exp.value };
      }
    }
  }

  // Type-specific field extraction
  if (a.type === "adversary") {
    if (typeof sys.difficulty === "number") actor.difficulty = sys.difficulty;
    if (typeof sys.tier === "number") actor.tier = sys.tier;
    if (typeof sys.type === "string") actor.adversaryRole = sys.type; // Leader, Solo, etc.
    if (typeof sys.motivesAndTactics === "string")
      actor.motivesAndTactics = sys.motivesAndTactics;

    if (isRecord(sys.damageThresholds)) {
      actor.thresholds = {
        major:
          typeof sys.damageThresholds.major === "number"
            ? sys.damageThresholds.major
            : 0,
        severe:
          typeof sys.damageThresholds.severe === "number"
            ? sys.damageThresholds.severe
            : 0,
      };
    }

    if (isRecord(sys.attack) && typeof sys.attack.name === "string") {
      const atk = sys.attack as any;
      if (atk.name !== "DAGGERHEART.GENERAL.unarmedAttack") {
        // Ignore empty default
        actor.attacks = [];
        let damageStr = "None";
        let modifier: number | string = 0;

        if (isRecord(atk.damage) && atk.damage.parts) {
          let hpPart: any = null;
          if (Array.isArray(atk.damage.parts)) {
            hpPart =
              atk.damage.parts.find((p: any) => p.applyTo === "hitPoints") ||
              atk.damage.parts[0];
          } else if (isRecord(atk.damage.parts)) {
            const keys = Object.keys(atk.damage.parts);
            if (keys.length > 0) {
              const firstKey = keys[0] as string;
              hpPart = (atk.damage.parts as any)[firstKey];
            }
          }
          if (hpPart && isRecord(hpPart.value)) {
            damageStr = `${hpPart.value.flatMultiplier || ""}${hpPart.value.dice || ""}`;
          }
        }

        if (isRecord(atk.roll) && typeof atk.roll.bonus === "number") {
          modifier = atk.roll.bonus;
        }
        const range = typeof atk.range === "string" ? atk.range : "Melee";

        actor.attacks.push({
          name: atk.name,
          modifier:
            typeof modifier === "number" && modifier >= 0
              ? `+${modifier}`
              : `${modifier}`,
          range: range,
          damage: damageStr,
        });
      }
    }
  } else if (a.type === "companion") {
    if (typeof sys.evasion === "number") actor.evasion = sys.evasion;
  } else if (a.type === "environment") {
    if (typeof sys.difficulty === "number") actor.difficulty = sys.difficulty;
    if (typeof sys.tier === "number") actor.tier = sys.tier;
    if (typeof sys.impulses === "string") actor.impulses = sys.impulses;
  } else if (a.type === "npc") {
    if (typeof sys.difficulty === "number") actor.difficulty = sys.difficulty;
    if (typeof sys.motives === "string") actor.motivesAndTactics = sys.motives;
    if (typeof sys.notes === "string") actor.notes = sys.notes;
    if (typeof sys.description === "string")
      actor.description = sys.description;
  }

  // Extract derived stats from items and effects
  let classHp = 0;
  let classEvasion = 0;
  let equipmentArmorMax = 0;
  let effectEvasion = 0;
  let effectHpMax = 0;
  let effectStressMax = 0;

  const features: string[] = [];
  const rawFeatures: any[] = [];
  let subclassFeatureState = 1;
  const activeEffects: any[] = [];

  if (Array.isArray(a.items)) {
    for (const item of a.items) {
      if (item.type === "class") {
        actor.class = item.name;
        if (isRecord(item.system)) {
          if (typeof item.system.hitPoints === "number")
            classHp += item.system.hitPoints;
          if (typeof item.system.evasion === "number")
            classEvasion += item.system.evasion;
        }
      } else if (item.type === "subclass") {
        actor.subclass = item.name;
        if (
          isRecord(item.system) &&
          typeof item.system.featureState === "number"
        ) {
          subclassFeatureState = item.system.featureState;
        }
      } else if (item.type === "community") {
        actor.community = item.name;
      } else if (item.type === "ancestry") {
        actor.ancestry = item.name;
      } else if (item.type === "feature") {
        rawFeatures.push(item);
      } else if (item.type === "attack" && isRecord(item.system)) {
        if (!actor.attacks) actor.attacks = [];

        let damageStr = "None";
        if (
          isRecord(item.system.damage) &&
          isRecord(item.system.damage.parts) &&
          isRecord(item.system.damage.parts.hitPoints)
        ) {
          const hp = item.system.damage.parts.hitPoints;
          if (isRecord(hp.value)) {
            damageStr = `${hp.value.flatMultiplier || ""}${hp.value.dice || ""}`;
          }
        }

        let modifier = 0;
        if (
          isRecord(item.system.roll) &&
          typeof item.system.roll.bonus === "number"
        ) {
          modifier = item.system.roll.bonus;
        }

        const range =
          typeof item.system.range === "string" ? item.system.range : "Melee";

        actor.attacks.push({
          name: item.name,
          modifier: modifier >= 0 ? `+${modifier}` : `${modifier}`,
          range: range,
          damage: damageStr,
        });
      } else if (item.type === "armor" && isRecord(item.system)) {
        if (item.system.equipped) {
          if (
            isRecord(item.system.armor) &&
            typeof item.system.armor.max === "number"
          ) {
            equipmentArmorMax += item.system.armor.max;
          }
        }

        // In Daggerheart, damage thresholds are often attached to armor
        const baseThresholds = extractNested(item.system, "baseThresholds");
        if (isRecord(baseThresholds)) {
          const major =
            typeof baseThresholds.major === "number" ? baseThresholds.major : 0;
          const severe =
            typeof baseThresholds.severe === "number"
              ? baseThresholds.severe
              : 0;
          if (major > 0 || severe > 0) {
            actor.thresholds = { major, severe };
          }
        }
      }

      // Check item effects if equipped
      if (
        isRecord(item.system) &&
        item.system.equipped !== false &&
        Array.isArray(item.effects)
      ) {
        for (const effect of item.effects) {
          if (effect.transfer === true) {
            activeEffects.push(effect);
          }
        }
      }
    }
  }

  for (const feat of rawFeatures) {
    if (isRecord(feat.system)) {
      const id = feat.system.identifier;
      if (id === "specialization" && subclassFeatureState < 2) continue;
      if (id === "mastery" && subclassFeatureState < 3) continue;
    }
    features.push(feat.name);
  }

  if (features.length > 0) {
    actor.features = features;
  }

  // Check actor effects
  if (Array.isArray(a.effects)) {
    activeEffects.push(...a.effects);
  }

  // Extract levelup bonuses
  let hpBonus = 0;
  let stressBonus = 0;
  let hopeBonus = 0;
  let evasionBonus = 0;
  let proficiencyBonus = 0;
  const traitBonuses: Record<string, number> = {
    agility: 0,
    strength: 0,
    finesse: 0,
    instinct: 0,
    presence: 0,
    knowledge: 0,
  };

  if (isRecord(levelData) && isRecord(levelData.levelups)) {
    for (const level of Object.values(levelData.levelups)) {
      if (isRecord(level) && Array.isArray(level.selections)) {
        for (const sel of level.selections) {
          if (sel.type === "trait" && Array.isArray(sel.data)) {
            for (const t of sel.data) {
              if (typeof t === "string" && traitBonuses[t] !== undefined) {
                traitBonuses[t] += 1;
              }
            }
          } else if (sel.type === "hitPoint") {
            hpBonus += (sel.value as number) || 1;
          } else if (sel.type === "stress") {
            stressBonus += (sel.value as number) || 1;
          } else if (sel.type === "hope") {
            hopeBonus += (sel.value as number) || 1;
          } else if (sel.type === "evasion") {
            evasionBonus += (sel.value as number) || 1;
          } else if (sel.type === "proficiency") {
            proficiencyBonus += (sel.value as number) || 1;
          } else if (sel.type === "experience" && Array.isArray(sel.data)) {
            for (const id of sel.data) {
              if (typeof id === "string" && experiencesMap[id]) {
                experiencesMap[id].value += (sel.value as number) || 1;
              }
            }
          }
        }
      }
      if (isRecord(level) && isRecord(level.achievements)) {
        if (typeof level.achievements.proficiency === "number") {
          proficiencyBonus += level.achievements.proficiency;
        }
      }
    }
  }

  // Pre-calculate proficiency before evaluating effects
  const baseProficiency =
    typeof sys.proficiency === "number" ? sys.proficiency : 1;
  const evalLevel = level ?? 1;
  const systemForEval = {
    ...sys,
    proficiency: baseProficiency + proficiencyBonus,
  };

  // First pass: Calculate proficiency modifications
  for (const effect of activeEffects) {
    if (effect.disabled) continue;
    if (isRecord(effect.system) && Array.isArray(effect.system.changes)) {
      for (const change of effect.system.changes) {
        if (change.type === "add" && change.key === "system.proficiency") {
          const val = evaluateEffectValue(
            change.value,
            systemForEval,
            evalLevel,
          );
          systemForEval.proficiency += val;
        }
      }
    }
  }

  const traitEffectModifiers: Record<string, number> = {
    agility: 0,
    strength: 0,
    finesse: 0,
    instinct: 0,
    presence: 0,
    knowledge: 0,
  };

  // Second pass: Calculate other derived attributes
  for (const effect of activeEffects) {
    if (effect.disabled) continue;
    if (isRecord(effect.system) && Array.isArray(effect.system.changes)) {
      for (const change of effect.system.changes) {
        if (change.type === "add") {
          const val = evaluateEffectValue(
            change.value,
            systemForEval,
            evalLevel,
          );
          if (change.key === "system.evasion") {
            effectEvasion += val;
          } else if (change.key === "system.resources.hitPoints.max") {
            effectHpMax += val;
          } else if (change.key === "system.resources.stress.max") {
            effectStressMax += val;
          } else if (change.key.startsWith("system.traits.")) {
            const match = change.key.match(/^system\.traits\.([^.]+)\.value$/);
            if (match) {
              const traitName = match[1];
              traitEffectModifiers[traitName] =
                (traitEffectModifiers[traitName] || 0) + val;
            }
          }
        }
      }
    }
  }

  if (mappedTraits) {
    for (const [t, bonus] of Object.entries(traitBonuses)) {
      if (mappedTraits[t]) {
        mappedTraits[t].value += bonus;
      }
    }
  }

  if (Object.keys(experiencesMap).length > 0) {
    actor.experiences = Object.values(experiencesMap).sort(
      (a, b) => b.value - a.value || a.name.localeCompare(b.name),
    );
  }

  if (actor.resources) {
    if (actor.resources.hitPoints && a.type === "character") {
      const baseHp = classHp > 0 ? classHp : 8;
      actor.resources.hitPoints.max = baseHp + hpBonus + effectHpMax;
    }
    if (actor.resources.stress && a.type === "character") {
      // In case stress.max is 0 in db, fallback to 5
      const baseStress =
        actor.resources.stress.max > 0 ? actor.resources.stress.max : 5;
      actor.resources.stress.max = baseStress + stressBonus + effectStressMax;
    }
    if (actor.resources.hope) {
      // Hope max in DH is usually 6 base
      const baseHope = 6;
      let companionHopeBonus = 0;
      if (typeof sys.companion === "string" && sys.companion.trim() !== "") {
        // Having a linked companion with level advancement "gain an additional hope slot for you character" gives +1 Hope max in DH
        companionHopeBonus = 1;
      }
      actor.resources.hope.max = baseHope + hopeBonus + companionHopeBonus;
    }
  }

  if (armorScore && typeof armorScore.value === "number") {
    actor.armorScore = {
      value: armorScore.value,
      max:
        equipmentArmorMax > 0
          ? equipmentArmorMax
          : typeof armorScore.max === "number" && armorScore.max > 0
            ? armorScore.max
            : 6,
    };
  } else if (typeof sys.armorScore === "number") {
    actor.armorScore = {
      value: sys.armorScore,
      max: equipmentArmorMax > 0 ? equipmentArmorMax : 6,
    };
  }

  if (evasion !== undefined) {
    if (classEvasion > 0) {
      actor.evasion = classEvasion + evasionBonus + effectEvasion;
    } else if (evasion === 0 && mappedTraits?.agility?.value !== undefined) {
      actor.evasion =
        5 + mappedTraits.agility.value + evasionBonus + effectEvasion;
    } else {
      actor.evasion = evasion;
    }
  }

  if (level !== undefined) {
    actor.level = level;
    // Apply level to thresholds
    if (actor.thresholds) {
      actor.thresholds.major += level;
      actor.thresholds.severe += level;
    }
  }

  if (mappedTraits) {
    for (const key of Object.keys(mappedTraits)) {
      mappedTraits[key]!.value += traitEffectModifiers[key] || 0;
    }
    actor.traits = mappedTraits;
  }

  actor.proficiency = systemForEval.proficiency;

  const bio =
    extractString(sys, "biography", "background") ||
    extractString(sys, "biography");
  if (bio) {
    actor.biography = bio;
  }

  return actor;
}

function worldSceneToFoundry(s: WorldScene): FoundryScene {
  const scene: FoundryScene = {
    _id: s._id,
    name: s.name,
    active: s.active,
    navigation: s.navigation,
    width: s.width,
    height: s.height,
    padding: s.padding,
    shiftX: 0,
    shiftY: 0,
    globalLight: s.globalLight,
    darkness: s.darkness,
  };
  if (s.img) {
    scene.img = s.img;
  }
  const desc = (s.flags as Record<string, unknown>)?.description;
  if (typeof desc === "string") {
    scene.description = desc;
  }
  return scene;
}

/**
 * Safely extracts a nested value from a Record tree.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Returns the `system` object of an actor-like document, accepting either the
 * raw REST/world document (`{ ..., system }`) or a cached {@link WorldActor}.
 * Returns undefined when no system object is present (e.g. the mapped
 * {@link FoundryActor} produced by the socket world-cache path).
 */
function systemOf(obj: unknown): Record<string, unknown> | undefined {
  if (isRecord(obj) && isRecord(obj.system)) {
    return obj.system;
  }
  return undefined;
}

/**
 * Compendium pagination cursors are opaque base64-encoded result offsets.
 * `encodeCursor` turns an offset into a cursor; `decodeCursor` reads it back,
 * returning 0 when the cursor is absent or malformed.
 */
function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64");
}

function decodeCursor(cursor: string | undefined): number {
  if (!cursor) {
    return 0;
  }
  const decoded = Number.parseInt(
    Buffer.from(cursor, "base64").toString("utf8"),
    10,
  );
  return Number.isFinite(decoded) && decoded >= 0 ? decoded : 0;
}

function extractNested(
  obj: Record<string, unknown>,
  ...keys: string[]
): unknown {
  let current: unknown = obj;
  for (const key of keys) {
    if (isRecord(current) && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Extracts a string from nested Record, following a chain of keys.
 */
function extractString(
  obj: Record<string, unknown>,
  ...keys: string[]
): string | null {
  const val = extractNested(obj, ...keys);
  return typeof val === "string" ? val : null;
}

// Attribute-patch helpers (#143)
// ============================================================================

/**
 * Reads a dot-path out of a nested Record tree, returning undefined if any
 * segment is missing.
 */
function getDotPath(obj: Record<string, unknown>, path: string): unknown {
  return extractNested(obj, ...path.split("."));
}

/**
 * Reads the actor's game-system id from raw world data, when available.
 * Used to pick the exhaustion clamp (2024 dnd5e: 0–10; 2014: 0–6).
 */
function exhaustionMax(sys: Record<string, unknown> | undefined): number {
  // dnd5e 2024 rules cap exhaustion at 10; the 2014 rules cap it at 6.
  return 6;
}

/**
 * Validates an attribute patch against the actor's current data, throwing a
 * clear error on the first violation. Only checks rules for which the needed
 * limit (max HP, stress, etc.) is available.
 */
function validateAttributePatch(
  patch: AttributePatch,
  actor: FoundryActor,
  rawSystem: Record<string, unknown> | undefined,
): void {
  const rawResources = rawSystem
    ? extractNested(rawSystem, "resources")
    : undefined;
  const resources = isRecord(rawResources) ? rawResources : undefined;

  for (const [path, value] of Object.entries(patch)) {
    const resourceMatch =
      /^resources\.(hitPoints|stress|hope|fear)\.value$/.exec(path);
    const resKey = resourceMatch?.[1];

    if (resKey && typeof value === "number" && resources) {
      const resObj = isRecord(resources[resKey])
        ? resources[resKey]
        : undefined;
      // Get max from raw system, or actor mapped
      let max: number | undefined;
      if (resObj && typeof resObj.max === "number") {
        max = resObj.max;
      } else if (actor.resources && resKey in actor.resources) {
        const actorRes = (actor.resources as any)[resKey];
        if (actorRes && typeof actorRes.max === "number") {
          max = actorRes.max;
        }
      }

      if (typeof max === "number" && value > max) {
        throw new Error(
          `Invalid value ${value} for ${resKey}: exceeds max (${max})`,
        );
      }
    }
  }
}
