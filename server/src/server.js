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
      console.log('ℹ Local MongoDB not detected on 27017. Starting persistent local database for development...');
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
      console.error('✖ Could not connect to remote MongoDB. Check MONGODB_URI/DATABASE_URL in your environment.');
      const prefix = env.MONGODB_URI ? env.MONGODB_URI.split('@').pop() : '(empty)';
      console.error(`  Target cluster host: ${prefix}`);
      console.error(`  Error details: ${err.message}`);
      process.exit(1);
    }
  }

  // Provision admin account if specified via environment variables (no hardcoded secrets)
  if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    try {
      const User = require('./models/User');
      const adminEmail = env.ADMIN_EMAIL.trim().toLowerCase();
      let admin = await User.findOne({
        $or: [
          { email: adminEmail },
          { name: env.ADMIN_NAME },
        ],
      });
      if (!admin) {
        admin = new User({
          name: env.ADMIN_NAME || 'Platform Administrator',
          email: adminEmail,
          role: 'admin',
          status: 'active',
          location: { city: 'New Delhi', state: 'Delhi' },
        });
      } else {
        admin.role = 'admin';
        admin.status = 'active';
      }
      await admin.setPassword(env.ADMIN_PASSWORD);
      await admin.save();
      console.log(`✔ Admin account ready: ${adminEmail}`);
    } catch (adminErr) {
      console.warn('Note on admin setup:', adminErr.message);
    }
  }

  const app = createApp();
  // Listen on 0.0.0.0 as required by container and cloud hosts (Render, Docker, etc.)
  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`✔ SwapThread API listening on http://0.0.0.0:${env.PORT} (${env.NODE_ENV})`);
  });
}

start();
