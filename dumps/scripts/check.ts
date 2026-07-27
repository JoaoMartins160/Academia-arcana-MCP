import 'dotenv/config';
import { FoundryClient } from '../../src/foundry/client.js';

async function main() {
  const client = new FoundryClient({
    baseUrl: process.env.FOUNDRY_URL!,
    username: process.env.FOUNDRY_USERNAME,
    password: process.env.FOUNDRY_PASSWORD,
    userId: process.env.FOUNDRY_USER_ID,
  });
  await client.connect();

  try {
    const actor = client.getActor('4boJ1p0ijGfwAAEE');
    console.log(JSON.stringify(actor, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

main();
