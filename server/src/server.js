const env = require('./config/env');
const { connectDB } = require('./config/db');
const { createApp } = require('./app');

async function start() {
  try {
    await connectDB(env.MONGODB_URI);
    console.log('✔ Connected to MongoDB');
  } catch (err) {
    console.error('✖ Could not connect to MongoDB. Check MONGODB_URI in your .env file.');
    console.error(`  ${err.message}`);
    process.exit(1);
  }
  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`✔ ReWear API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });
}

start();
