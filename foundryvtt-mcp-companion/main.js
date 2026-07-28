/**
 * Foundry MCP Companion — Official Companion Module for Academia-arcana-MCP
 * 
 * Provides native WebSocket bridge and compendium query RPC for Foundry VTT (v11 - v14).
 * 
 * @version 1.1.0
 * @author João Pedro (Academia Arcana Team)
 */

class FoundryMCPCompanion {
  static MODULE_ID = 'foundryvtt-mcp-companion';
  static ws = null;
  static reconnectTimer = null;
  static isConnected = false;

  static log(message, ...args) {
    const debug = game.settings.get(FoundryMCPCompanion.MODULE_ID, 'debugLogs');
    if (debug) {
      console.log(`🔮 [MCP Companion] ${message}`, ...args);
    }
  }

  static info(message, ...args) {
    console.log(`🔮 [MCP Companion] ${message}`, ...args);
  }

  static error(message, ...args) {
    console.error(`❌ [MCP Companion Error] ${message}`, ...args);
  }

  /**
   * Register Module Settings in Foundry VTT Game Settings menu
   */
  static registerSettings() {
    game.settings.register(FoundryMCPCompanion.MODULE_ID, 'port', {
      name: 'Porta WebSocket MCP',
      hint: 'Porta do servidor WebSocket auxiliar para comunicação com o MCP Server (padrão: 31415)',
      scope: 'world',
      config: true,
      type: Number,
      default: 31415,
      onChange: (value) => {
        ui.notifications.info(`Foundry MCP Companion: Porta alterada para ${value}. Reconectando...`);
        FoundryMCPCompanion.reconnect();
      }
    });

    game.settings.register(FoundryMCPCompanion.MODULE_ID, 'autoConnect', {
      name: 'Conectar Automaticamente',
      hint: 'Conecta ao servidor MCP automaticamente ao carregar o mundo.',
      scope: 'world',
      config: true,
      type: Boolean,
      default: true,
      onChange: (value) => {
        if (value) {
          FoundryMCPCompanion.connect();
        } else {
          FoundryMCPCompanion.disconnect();
        }
      }
    });

    game.settings.register(FoundryMCPCompanion.MODULE_ID, 'reconnectInterval', {
      name: 'Intervalo de Reconexão (segundos)',
      hint: 'Tempo em segundos entre tentativas de reconexão quando desconectado.',
      scope: 'world',
      config: true,
      type: Number,
      default: 5
    });

    game.settings.register(FoundryMCPCompanion.MODULE_ID, 'debugLogs', {
      name: 'Logs de Depuração no Console',
      hint: 'Habilita mensagens detalhadas de diagnósticos no DevTools.',
      scope: 'world',
      config: true,
      type: Boolean,
      default: false
    });
  }

  /**
   * Connect to WebSocket MCP Server
   */
  static connect() {
    const autoConnect = game.settings.get(FoundryMCPCompanion.MODULE_ID, 'autoConnect');
    if (!autoConnect) return;

    const port = game.settings.get(FoundryMCPCompanion.MODULE_ID, 'port') || 31415;
    const url = `ws://localhost:${port}`;

    if (FoundryMCPCompanion.ws && (FoundryMCPCompanion.ws.readyState === WebSocket.OPEN || FoundryMCPCompanion.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      FoundryMCPCompanion.info(`Conectando ao servidor MCP em ${url}...`);
      FoundryMCPCompanion.ws = new WebSocket(url);

      FoundryMCPCompanion.ws.onopen = () => {
        FoundryMCPCompanion.isConnected = true;
        FoundryMCPCompanion.info(`✅ Conectado com sucesso ao servidor MCP WebSocket (Porta ${port}).`);
        if (FoundryMCPCompanion.reconnectTimer) {
          clearTimeout(FoundryMCPCompanion.reconnectTimer);
          FoundryMCPCompanion.reconnectTimer = null;
        }
        ui.notifications.info(`Foundry MCP Companion: Conectado na porta ${port}`);
        FoundryMCPCompanion.updateStatusControl();
      };

      FoundryMCPCompanion.ws.onmessage = async (event) => {
        await FoundryMCPCompanion.handleRPCRequest(event.data);
      };

      FoundryMCPCompanion.ws.onclose = () => {
        FoundryMCPCompanion.isConnected = false;
        FoundryMCPCompanion.info("Desconectado do servidor MCP. Agendando reconexão...");
        FoundryMCPCompanion.updateStatusControl();
        FoundryMCPCompanion.scheduleReconnect();
      };

      FoundryMCPCompanion.ws.onerror = (err) => {
        FoundryMCPCompanion.error("Erro na conexão WebSocket:", err);
        if (FoundryMCPCompanion.ws) {
          FoundryMCPCompanion.ws.close();
        }
      };
    } catch (err) {
      FoundryMCPCompanion.error("Erro ao inicializar WebSocket:", err);
      FoundryMCPCompanion.scheduleReconnect();
    }
  }

  static disconnect() {
    if (FoundryMCPCompanion.reconnectTimer) {
      clearTimeout(FoundryMCPCompanion.reconnectTimer);
      FoundryMCPCompanion.reconnectTimer = null;
    }
    if (FoundryMCPCompanion.ws) {
      FoundryMCPCompanion.ws.close();
      FoundryMCPCompanion.ws = null;
    }
    FoundryMCPCompanion.isConnected = false;
    FoundryMCPCompanion.updateStatusControl();
  }

  static reconnect() {
    FoundryMCPCompanion.disconnect();
    FoundryMCPCompanion.connect();
  }

  static scheduleReconnect() {
    if (!FoundryMCPCompanion.reconnectTimer) {
      const intervalSec = game.settings.get(FoundryMCPCompanion.MODULE_ID, 'reconnectInterval') || 5;
      FoundryMCPCompanion.reconnectTimer = setTimeout(() => {
        FoundryMCPCompanion.reconnectTimer = null;
        FoundryMCPCompanion.connect();
      }, intervalSec * 1000);
    }
  }

  /**
   * Handle incoming RPC requests from MCP Server
   */
  static async handleRPCRequest(rawMessage) {
    try {
      const request = JSON.parse(rawMessage);
      FoundryMCPCompanion.log("Requisição RPC recebida:", request);

      if (!request || !request.method || !request.id) return;

      let responseData = null;

      if (request.method === "getCompendiumsList") {
        responseData = Array.from(game.packs.values()).map(p => ({
          id: p.collection,
          title: p.title,
          package: p.metadata.packageType || p.metadata.packageName,
          type: p.documentName,
          system: p.metadata.system
        }));
      } 
      else if (request.method === "searchCompendium") {
        const query = (request.query || "").toLowerCase();
        const limit = request.limit || 25;
        const results = [];

        let packsToSearch = Array.from(game.packs.values());
        if (request.filters?.compendiumId) {
          packsToSearch = packsToSearch.filter(p => p.collection === request.filters.compendiumId);
        }

        for (const pack of packsToSearch) {
          if (request.filters?.packType && pack.documentName !== request.filters.packType) {
            continue;
          }

          const index = await pack.getIndex({ 
            fields: ["name", "type", "system.level", "system.school", "system.source.rules", "system.tier", "system.domain"] 
          });

          for (const entry of index) {
            if (query && !entry.name.toLowerCase().includes(query)) continue;
            if (request.filters?.itemType && entry.type !== request.filters.itemType) continue;
            if (request.filters?.spellLevel !== undefined && entry.system?.level !== request.filters.spellLevel) continue;
            if (request.filters?.source && entry.system?.source?.rules !== request.filters.source) continue;

            results.push({
              itemId: entry._id,
              compendiumId: pack.collection,
              name: entry.name,
              type: entry.type || pack.documentName,
              system: entry.system || {}
            });

            if (results.length >= limit) break;
          }
          if (results.length >= limit) break;
        }

        responseData = {
          results,
          total: results.length,
          page: 1,
          limit
        };
      } else {
        throw new Error(`Método desconhecido: ${request.method}`);
      }

      FoundryMCPCompanion.ws.send(JSON.stringify({
        id: request.id,
        success: true,
        data: responseData
      }));
    } catch (error) {
      FoundryMCPCompanion.error("Erro ao processar requisição RPC:", error);
      if (FoundryMCPCompanion.ws && FoundryMCPCompanion.ws.readyState === WebSocket.OPEN) {
        try {
          const reqId = rawMessage ? JSON.parse(rawMessage).id : "unknown";
          FoundryMCPCompanion.ws.send(JSON.stringify({
            id: reqId,
            success: false,
            error: error.message
          }));
        } catch (e) {}
      }
    }
  }

  /**
   * Status Button Control on Foundry Scene Controls UI
   */
  static updateStatusControl() {
    const iconClass = FoundryMCPCompanion.isConnected ? 'fa-bolt text-success' : 'fa-bolt text-danger';
    const statusText = FoundryMCPCompanion.isConnected ? 'MCP Companion: Conectado' : 'MCP Companion: Desconectado';
    
    // Refresh Scene Controls if active
    if (ui.controls) {
      ui.controls.render(true);
    }
  }
}

// Foundry VTT Hooks
Hooks.once('init', () => {
  console.log("🔮 [Foundry MCP Companion] Inicializando módulo...");
  FoundryMCPCompanion.registerSettings();
});

Hooks.once('ready', () => {
  FoundryMCPCompanion.info("Mundo pronto. Iniciando ponte WebSocket MCP...");
  FoundryMCPCompanion.connect();
});

Hooks.on('getSceneControlButtons', (controls) => {
  const tokenControls = controls.find(c => c.name === "tokens" || c.name === "token");
  if (tokenControls) {
    tokenControls.tools.push({
      name: "mcp-companion-status",
      title: FoundryMCPCompanion.isConnected ? "MCP Companion: Conectado" : "MCP Companion: Desconectado (Clique para Reconectar)",
      icon: "fas fa-plug-circle-bolt",
      visible: game.user.isGM,
      onClick: () => {
        if (!FoundryMCPCompanion.isConnected) {
          ui.notifications.info("Reconectando ao servidor MCP...");
          FoundryMCPCompanion.reconnect();
        } else {
          ui.notifications.info("Foundry MCP Companion está ativo e conectado!");
        }
      },
      button: true
    });
  }
});
