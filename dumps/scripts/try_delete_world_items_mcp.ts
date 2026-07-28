import { FoundryClient } from "../../src/foundry/client.js";
import dotenv from "dotenv";
dotenv.config();

async function tryDeleteWorldItems() {
  const client = new FoundryClient({
    baseUrl: process.env.FOUNDRY_URL || "http://localhost:30000",
    username: process.env.FOUNDRY_USERNAME || "mcp-server",
    password: process.env.FOUNDRY_PASSWORD || "Tormenta20",
    timeout: 10000,
  });

  await client.connect();
  console.log("Connected to FoundryVTT via Socket.IO!");

  const targetIds = ["RZya3JjRa9R4Ovfy", "e8GWdZIosDnw8lKG", "6fLVCYtAWzJmKh10"];

  for (const itemId of targetIds) {
    try {
      console.log(`Attempting to delete World Item "${itemId}"...`);
      // @ts-ignore
      const result = await client.modifyDocument("Item", "delete", {
        ids: [itemId],
      });
      console.log(`Successfully deleted World Item "${itemId}":`, result);
    } catch (err: any) {
      console.error(`Failed to delete World Item "${itemId}":`, err.message || err);
    }
  }

  await client.disconnect();
}

tryDeleteWorldItems().catch(console.error);
