import { FoundryClient } from "../../src/foundry/client.js";
import { config } from "../../src/config/index.js";
import dotenv from "dotenv";
dotenv.config();

async function findCorruptedItems() {
  const client = new FoundryClient({
    baseUrl: process.env.FOUNDRY_URL || config.foundryUrl || "http://localhost:30000",
    username: process.env.FOUNDRY_USERNAME || config.foundryUsername || "mcp-server",
    password: process.env.FOUNDRY_PASSWORD || config.foundryPassword || "Tormenta20",
    timeout: 10000,
  });

  await client.connect();
  console.log("Connected to FoundryVTT!");

  const targetIds = ["RZya3JjRa9R4Ovfy", "e8GWdZIosDnw8lKG", "6fLVCYtAWzJmKh10"];

  // 1. Search world items
  const worldItems = await client.searchItems({ limit: 100 });
  console.log(`Found ${worldItems.total} world items.`);

  // 2. Search actors
  const actorsResult = await client.searchActors({ limit: 100 });
  console.log(`Found ${actorsResult.total} actors.`);

  for (const actorSummary of actorsResult.actors) {
    try {
      const fullActor = await client.getActorDetails(actorSummary._id);
      if (fullActor && fullActor.items) {
        for (const item of fullActor.items) {
          if (targetIds.includes(item._id)) {
            console.log(`FOUND CORRUPTED ITEM "${item.name}" (${item._id}) ON ACTOR "${fullActor.name}" (${fullActor._id})`);
          }
          // Check for advState: 0 or invalid choices
          const actions = item.system?.actions;
          if (actions) {
            for (const actKey of Object.keys(actions)) {
              if (actions[actKey]?.roll?.advState === 0) {
                console.log(`Found advState: 0 on item "${item.name}" (${item._id}) of Actor "${fullActor.name}" (${fullActor._id})`);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(`Error fetching actor ${actorSummary._id}:`, err);
    }
  }

  await client.disconnect();
}

findCorruptedItems().catch(console.error);
