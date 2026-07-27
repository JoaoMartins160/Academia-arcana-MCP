import { FoundryClient } from '../../dist/foundry/client.js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../../.env') });

async function deleteBrokenActor() {
  const client = new FoundryClient({
    baseUrl: process.env.FOUNDRY_API_URL || 'http://localhost:30000',
    world: process.env.FOUNDRY_WORLD || 'test',
    username: process.env.FOUNDRY_USERNAME || 'Gamemaster',
    password: process.env.FOUNDRY_PASSWORD || '',
    timeout: 10000,
    writeEnabled: true,
  });

  // Mock startCompanionServer to avoid EADDRINUSE crash
  client.startCompanionServer = async () => {};

  try {
    await client.connect();
    console.log('Connected to Foundry.');
    
    console.log('Deleting actor IkaVBKz5SzNLwKar...');
    await client.deleteActor('IkaVBKz5SzNLwKar');
    
    console.log('Actor deleted successfully!');
  } catch (error) {
    console.error('Error deleting actor:', error);
  } finally {
    client.disconnect();
    process.exit(0);
  }
}

deleteBrokenActor();
