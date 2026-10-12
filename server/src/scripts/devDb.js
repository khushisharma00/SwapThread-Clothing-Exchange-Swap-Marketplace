const path = require('path');
const fs = require('fs');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function run() {
  const dbPath = path.resolve(__dirname, '../../../.data/db');
  fs.mkdirSync(dbPath, { recursive: true });
  console.log('Starting local persistent MongoDB on port 27017...');
  const mongod = await MongoMemoryServer.create({
    instance: { port: 27017, dbPath, dbName: 'rewear' },
  });
  console.log(`✔ Local MongoDB running on ${mongod.getUri()} (data in .data/db)`);
  console.log('Press Ctrl+C to stop.');

  process.on('SIGINT', async () => {
    console.log('Stopping local MongoDB...');
    await mongod.stop();
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    await mongod.stop();
    process.exit(0);
  });
}

run().catch((err) => {
  console.error('Failed to start local MongoDB:', err);
  process.exit(1);
});
