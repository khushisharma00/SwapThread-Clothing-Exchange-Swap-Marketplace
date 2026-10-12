const path = require('path');
const fs = require('fs');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const { createApp } = require('./app');

async function start() {
  try {
    await connectDB(env.MONGODB_URI);
    console.log('✔ Connected to MongoDB');
  } catch (err) {
    if (env.NODE_ENV === 'development' && env.MONGODB_URI.includes('127.0.0.1:27017')) {
      console.log('ℹ Local MongoDB not detected on 27017. Starting persistent local database...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const dbPath = path.resolve(__dirname, '../../.data/db');
        fs.mkdirSync(dbPath, { recursive: true });
        const mongod = await MongoMemoryServer.create({
          instance: { port: 27017, dbPath, dbName: 'rewear' },
        });
        await connectDB(env.MONGODB_URI);
        console.log(`✔ Connected to local persistent MongoDB at ${mongod.getUri()}`);
      } catch (innerErr) {
        console.error('✖ Could not start local MongoDB:', innerErr.message);
        process.exit(1);
      }
    } else {
      console.error('✖ Could not connect to MongoDB. Check MONGODB_URI in your .env file.');
      console.error(`  ${err.message}`);
      process.exit(1);
    }
  }
  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`✔ ReWear API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });
}

start();
