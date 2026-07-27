
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
  
  console.log('Connected! Sending pings...');
  
  setInterval(() => {
    console.log('Pinging companion...');
    client['socket'].emit('module.foundryvtt-mcp-companion', { id: 'ping-' + Date.now(), method: 'getCompendiumsList' });
  }, 2000);
  
  client['socket'].on('module.foundryvtt-mcp-companion', (data) => {
    console.log('Received response!', data);
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

