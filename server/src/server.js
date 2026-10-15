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
      console.error('\n' + '='.repeat(72));
      console.error('✖ SwapThread Startup Error: Could not connect to MongoDB database.');
      console.error('='.repeat(72));

      const rawUri = env.MONGODB_URI || '';
      const maskedUri = rawUri ? rawUri.replace(/:([^@]+)@/, ':****@') : '(empty)';
      console.error(`  Configured URI: ${maskedUri}`);
      console.error(`  Error message:  ${err.message}`);

      if (!rawUri || (!rawUri.startsWith('mongodb://') && !rawUri.startsWith('mongodb+srv://'))) {
        console.error('\n⚠️  DIAGNOSIS: Invalid MongoDB URI scheme.');
        console.error('  The MONGODB_URI environment variable on Render appears to contain placeholder');
        console.error('  text instead of your actual MongoDB Atlas connection string.');
        console.error('\n👉 HOW TO FIX ON RENDER:');
        console.error('  1. Go to your Render Dashboard (https://dashboard.render.com).');
        console.error('  2. Click on your SwapThread web service.');
        console.error('  3. Open the "Environment" tab in the left sidebar.');
        console.error('  4. Find MONGODB_URI and replace the placeholder text with your real MongoDB Atlas connection string:');
        console.error('     mongodb+srv://<username>:<password>@<cluster>.mongodb.net/swapthread?retryWrites=true&w=majority');
        console.error('  5. Click "Save Changes" — Render will automatically redeploy successfully!');
      } else if (rawUri.includes('<') || rawUri.includes('>')) {
        console.error('\n⚠️  DIAGNOSIS: Connection string contains unreplaced angle brackets ("<" or ">").');
        console.error('  Please replace <username> and <password> with your actual MongoDB user credentials.');
      } else {
        console.error('\n👉 TROUBLESHOOTING TIPS:');
        console.error('  1. In MongoDB Atlas, go to "Network Access" and ensure 0.0.0.0/0 (Allow Anywhere) is enabled.');
        console.error('  2. In MongoDB Atlas, verify your Database User username & password in "Database Access".');
      }
      console.error('='.repeat(72) + '\n');
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
