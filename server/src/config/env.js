const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';

let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'replace-with-a-long-random-secret') {
  if (isProduction) {
    throw new Error('JWT_SECRET must be set to a strong random value in production.');
  }
  JWT_SECRET = 'dev-only-insecure-secret-change-me';
}

const env = {
  NODE_ENV,
  isProduction,
  isTest,
  PORT: Number(process.env.PORT) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rewear',
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_ORIGINS: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  COOKIE_NAME: 'rewear_token',
};

module.exports = env;
