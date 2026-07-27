
import { FoundryClient } from '../../src/foundry/client.js';
import { config } from '../../src/config/index.js';

async function main() {
  const client = new FoundryClient({
    baseUrl: config.foundry.url,
    username: config.foundry.username,
    password: config.foundry.password,
    userId: config.foundry.userId,
    socketPath: config.foundry.socketPath,
    timeout: config.foundry.timeout,
    retryAttempts: config.foundry.retryAttempts,
    retryDelay: config.foundry.retryDelay,
    writeEnabled: config.foundry.writeEnabled,
  });
  await client.connectAndLoadWorld();
  
  const system = client['worldData'].system;
  const world = client['worldData'].world;
  const modules = client['worldData'].modules;
  
  let packs = [];
  if (system?.packs) packs = packs.concat(system.packs);
  if (world?.packs) packs = packs.concat(world.packs);
  modules?.forEach(m => {
    if (m.packs) packs = packs.concat(m.packs.map(p => ({...p, package: m.id})));
  });
  
  console.log('Total packs found:', packs.length);
  console.log(JSON.stringify(packs, null, 2));
  process.exit(0);
}
main().catch(console.error);

