import 'dotenv/config';
import { FoundryClient } from '../../src/foundry/client.js';

process.env.FOUNDRY_WRITE_ENABLED = 'true';

async function main() {
  const client = new FoundryClient({
    baseUrl: process.env.FOUNDRY_URL!,
    username: process.env.FOUNDRY_USERNAME,
    password: process.env.FOUNDRY_PASSWORD,
    userId: process.env.FOUNDRY_USER_ID,
    writeEnabled: true,
  });
  await client.connect();

  try {
    const folders = client.getFolders();
    
    // Find or create 'Features'
    let featuresFolder = folders.find(f => f.name.toLowerCase() === 'features' && f.type === 'Item');
    if (!featuresFolder) {
      console.log('Creating "Features" folder...');
      const result = await (client as any).modifyDocument('Folder', 'create', { data: [{ name: 'Features', type: 'Item', folder: null }] });
      featuresFolder = result[0];
    }

    // Find or create 'Adversaries' inside 'Features'
    let adversariesFolder = folders.find(f => f.name.toLowerCase() === 'adversaries' && f.type === 'Item' && f.folder === featuresFolder._id);
    if (!adversariesFolder) {
      console.log('Creating "Adversaries" folder...');
      const result = await (client as any).modifyDocument('Folder', 'create', { data: [{ name: 'Adversaries', type: 'Item', folder: featuresFolder._id }] });
      adversariesFolder = result[0];
    }

    // Find or create 'teste' inside 'Adversaries'
    let testeFolder = folders.find(f => f.name.toLowerCase() === 'teste' && f.type === 'Item' && f.folder === adversariesFolder._id);
    if (!testeFolder) {
      console.log('Creating "teste" folder...');
      const result = await (client as any).modifyDocument('Folder', 'create', { data: [{ name: 'teste', type: 'Item', folder: adversariesFolder._id }] });
      testeFolder = result[0];
    }

    console.log(`Target folder ID: ${testeFolder._id}`);

    if (!(client as any).worldData) {
      console.log("No world data");
      process.exit(1);
    }

    const itemNames = ['ember sprint', 'flaming bite', 'pack tactics'];
    const itemsToMove = (client as any).worldData.items.filter((i: any) => itemNames.includes(i.name.toLowerCase()));
    
    console.log(`Found ${itemsToMove.length} items to move.`);

    for (const item of itemsToMove) {
      console.log(`Moving ${item.name} (${item._id})...`);
      await (client as any).modifyDocument('Item', 'update', {
        updates: [{ _id: item._id, folder: testeFolder._id }]
      });
      console.log(`Updated ${item.name}.`);
    }

  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

main();
