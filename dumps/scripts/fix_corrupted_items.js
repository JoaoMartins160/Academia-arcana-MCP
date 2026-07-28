import { ClassicLevel } from "classic-level";
import path from "node:path";
import fs from "node:fs";

const worldPath = "C:\\Users\\João Pedro\\AppData\\Local\\FoundryVTT\\Data\\worlds\\academia-arcana-dagger\\data";
const targetIds = ["RZya3JjRa9R4Ovfy", "e8GWdZIosDnw8lKG", "6fLVCYtAWzJmKh10"];

async function checkAndFixDb(dbName) {
  const dbDir = path.join(worldPath, dbName);
  if (!fs.existsSync(dbDir)) return;

  const db = new ClassicLevel(dbDir, { valueEncoding: "json" });
  await db.open();

  console.log(`--- Checking database: ${dbName} ---`);

  for await (const [key, doc] of db.iterator()) {
    // 1. Direct item match
    if (targetIds.includes(doc._id) || targetIds.includes(key)) {
      console.log(`Found target item directly in ${dbName}: "${doc.name}" (${doc._id})`);
      await db.del(key);
      console.log(`DELETED key "${key}" from ${dbName}`);
    }

    // 2. Embedded items in Actors
    if (doc.items && Array.isArray(doc.items)) {
      const originalCount = doc.items.length;
      const filteredItems = doc.items.filter((item) => {
        if (targetIds.includes(item._id)) {
          console.log(`Found target item "${item.name}" (${item._id}) inside Actor "${doc.name}" (${doc._id})`);
          return false;
        }

        // Also check for advState: 0 or range: "ranged" or damage hitPoints type: ["magic"]
        if (item.system?.actions) {
          for (const actionKey of Object.keys(item.system.actions)) {
            const action = item.system.actions[actionKey];
            if (action?.roll?.advState === 0) {
              console.log(`Fixing advState: 0 in item "${item.name}" (${item._id}) on Actor "${doc.name}"`);
              action.roll.advState = "none";
            }
            if (action?.range === "ranged") {
              console.log(`Fixing range: "ranged" -> "Far" in item "${item.name}" (${item._id}) on Actor "${doc.name}"`);
              action.range = "Far";
            }
          }
        }

        if (item.system?.attack) {
          if (item.system.attack.roll?.advState === 0) {
            console.log(`Fixing attack advState: 0 in item "${item.name}" (${item._id}) on Actor "${doc.name}"`);
            item.system.attack.roll.advState = "none";
          }
          if (item.system.attack.range === "ranged") {
            console.log(`Fixing attack range: "ranged" -> "Far" in item "${item.name}" (${item._id}) on Actor "${doc.name}"`);
            item.system.attack.range = "Far";
          }
        }

        return true;
      });

      if (filteredItems.length !== originalCount) {
        doc.items = filteredItems;
        await db.put(key, doc);
        console.log(`Updated Actor "${doc.name}" (${doc._id}), removed/fixed corrupted items.`);
      }
    }
  }

  await db.close();
}

async function main() {
  await checkAndFixDb("items");
  await checkAndFixDb("actors");
  console.log("Inspection & cleanup complete!");
}

main().catch(console.error);
