/**
 * Creates (or promotes) an administrator account. Nothing is hard-coded.
 *
 * Interactive:   npm run create-admin
 * Non-interactive (e.g. Render Shell):
 *   ADMIN_NAME="Site Admin" ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='S0me-strong-pass' npm run create-admin
 */
const readline = require('readline');
const env = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const { EMAIL_RE } = require('../utils/validate');

function ask(rl, question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    if (!hidden) return rl.question(question, (a) => resolve(a.trim()));
    const out = rl.output;
    rl.output = { write: () => {} };
    out.write(question);
    rl.question('', (a) => {
      rl.output = out;
      out.write('\n');
      resolve(a);
    });
  });
}

async function main() {
  let { ADMIN_NAME: name, ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  if (!email || !password) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    name = name || (await ask(rl, 'Admin name: '));
    email = email || (await ask(rl, 'Admin email: '));
    password = password || (await ask(rl, 'Admin password (min 10 chars, letters + numbers): ', { hidden: true }));
    rl.close();
  }
  email = String(email || '').trim().toLowerCase();
  name = String(name || 'Administrator').trim();
  if (!EMAIL_RE.test(email)) throw new Error('A valid email is required');
  if (!password || password.length < 10 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new Error('Password must be at least 10 characters and contain letters and numbers');
  }

  await connectDB(env.MONGODB_URI);
  let user = await User.findOne({ email });
  if (user) {
    user.role = 'admin';
    user.status = 'active';
  } else {
    user = new User({ name, email, role: 'admin' });
  }
  await user.setPassword(password);
  await user.save();
  console.log(`✔ Administrator ready: ${email}. Log in and open /admin.`);
}

main()
  .catch((err) => {
    console.error(`✖ ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB().catch(() => {}));
