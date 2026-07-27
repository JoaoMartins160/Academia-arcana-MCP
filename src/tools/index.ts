/**
 * Tools module entry point
 */

// Export tool and resource definitions
export { getAllTools } from "./definitions.js";
export * from "./handlers/actor/actor-handler.js";
export * from "./handlers/chat/chat-handler.js";
export * from "./handlers/combat/combat-handler.js";
export * from "./handlers/diagnostic/diagnostic-handler.js";
// Export individual handlers for testing
export * from "./handlers/dice/dice-handler.js";
export * from "./handlers/generation/generation-handler.js";
export * from "./handlers/generation/adversary-generation.js";
export * from "./handlers/item/item-handler.js";
export * from "./handlers/journal/journal-handler.js";
export * from "./handlers/resource/resource-handler.js";
export * from "./handlers/scene/scene-handler.js";
export * from "./handlers/user/user-handler.js";
export * from "./handlers/world/world-handler.js";
export { getAllResources } from "./resources.js";
// Export routing functions
export { routeResourceRequest, routeToolRequest } from "./router.js";
