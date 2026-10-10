const mongoose = require('mongoose');
const request = require('supertest');
const { createApp } = require('../src/app');
const User = require('../src/models/User');

let mongod = null;
const app = createApp();

/**
 * Uses MONGODB_URI_TEST when provided (e.g. a CI MongoDB service container),
 * otherwise starts a throwaway in-memory MongoDB via mongodb-memory-server.
 */
async function startDB() {
  let uri = process.env.MONGODB_URI_TEST;
  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
  }
  const dbName = `rewear_test_${process.pid}_${Math.random().toString(36).slice(2, 8)}`;
  await mongoose.connect(uri, { dbName });
  await Promise.all(Object.values(mongoose.models).map((m) => m.syncIndexes()));
}

async function stopDB() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  if (mongod) await mongod.stop();
}

const PASSWORD = 'Passw0rd!';

async function registerAgent(name, city = 'New Delhi') {
  const agent = request.agent(app);
  const email = `${name.toLowerCase().replace(/\s+/g, '.')}.${Math.random().toString(36).slice(2, 7)}@test.dev`;
  const res = await agent.post('/api/auth/register').send({ name, email, password: PASSWORD, city });
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { agent, user: res.body.data.user, email };
}

async function makeAdmin(userId) {
  await User.updateOne({ _id: userId }, { role: 'admin' });
}

const baseListing = {
  title: 'Classic Denim Jacket',
  description: 'Well-kept denim jacket with all buttons intact.',
  category: 'jackets',
  clothingType: 'Denim jacket',
  audience: 'unisex',
  brand: "Levi's",
  size: 'M',
  condition: 'good',
  color: 'Blue',
};

async function createListing(agent, overrides = {}) {
  const res = await agent.post('/api/listings').send({ ...baseListing, ...overrides });
  if (res.status !== 201) throw new Error(`create listing failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data.listing;
}

module.exports = { app, request, startDB, stopDB, registerAgent, makeAdmin, createListing, baseListing, PASSWORD };
