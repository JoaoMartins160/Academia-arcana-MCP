
import { FoundryClient } from '../../src/foundry/client.js';
import { config } from '../../src/config/index.js';

async function main() {
  const clientConfig = {
    baseUrl: config.foundry.url,
    socketPath: config.foundry.socketPath,
    timeout: config.foundry.timeout,
    retryAttempts: config.foundry.retryAttempts,
    retryDelay: config.foundry.retryDelay,
    writeEnabled: config.foundry.writeEnabled,
    username: config.foundry.username,
    password: config.foundry.password,
    userId: config.foundry.userId
  };
  
  const client = new FoundryClient(clientConfig);
  await client.connect();
  
  console.log('Connected! Server is alive for 30 seconds. Please refresh Foundry tab now!');
  await new Promise(r => setTimeout(r, 10000));
  
  console.log('Fetching compendiums...');
  try {
    const packs = await client.getCompendiumsList();
    console.log(JSON.stringify(packs, null, 2));
  } catch (e) {
    console.error(e);
  }
  
  await client.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

