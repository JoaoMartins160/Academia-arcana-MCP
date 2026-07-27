import { ClassicLevel } from "classic-level";

const dbPath =
  "C:\\Users\\João Pedro\\AppData\\Local\\FoundryVTT\\Data\\worlds\\academia-arcana-dagger\\data\\actors";
const db = new ClassicLevel(dbPath, { valueEncoding: "json" });

async function fixActors() {
  await db.open();
  let fixedCount = 0;
  for await (const [key, actor] of db.iterator()) {
    if (!actor.items) continue;

    const originalItemCount = actor.items.length;
    // Filter out items that cause the error
    actor.items = actor.items.filter((item) => {
      try {
        // Check if the item has the bad damage parts
        if (item.system?.damage?.parts?.hitPoints) {
          const hp = item.system.damage.parts.hitPoints;
          if (hp.value && typeof hp.value.dice === "object") {
            console.log(
              `Deleting bad item "${item.name}" from actor "${actor.name}" (${actor._id})`,
            );
            return false;
          }
        }
      } catch (e) {
        console.error("Error checking item", e);
      }
      return true;
    });

    if (actor.items.length !== originalItemCount) {
      await db.put(key, actor);
      console.log(
        `Updated actor "${actor.name}" (${actor._id}). Removed ${originalItemCount - actor.items.length} items.`,
      );
      fixedCount++;
    }
  }
  await db.close();
  console.log(`Finished. Fixed ${fixedCount} actors.`);
}

fixActors().catch(console.error);
