const { app, request, startDB, stopDB, registerAgent, PASSWORD } = require('./helpers');
const User = require('../src/models/User');

beforeAll(startDB);
afterAll(stopDB);

describe('Authentication', () => {
  const email = 'meera.test@example.com';

  test('registers a user, hashes the password and sets an httpOnly cookie', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Meera', email, password: PASSWORD, city: 'Bengaluru', role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user.role).toBe('customer'); // client-supplied role is ignored
    expect(res.body.data.user.location.city).toBe('Bengaluru');
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    const cookie = res.headers['set-cookie'].join(';');
    expect(cookie).toMatch(/rewear_token=/);
    expect(cookie).toMatch(/HttpOnly/i);

    const stored = await User.findOne({ email }).select('+passwordHash');
    expect(stored.passwordHash).not.toBe(PASSWORD);
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$12\$/); // bcrypt, cost 12
  });

  test('rejects duplicate emails with 409', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Meera 2', email: email.toUpperCase(), password: PASSWORD });
    expect(res.status).toBe(409);
  });

  test('validates registration input', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'A', email: 'not-an-email', password: 'short', city: 'Atlantis' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('name');
    expect(res.body.errors).toHaveProperty('email');
    expect(res.body.errors).toHaveProperty('password');
    expect(res.body.errors).toHaveProperty('city');

    const weak = await request(app).post('/api/auth/register').send({ name: 'Weak', email: 'weak@example.com', password: 'onlyletters' });
    expect(weak.status).toBe(400);
    expect(weak.body.errors.password).toMatch(/letter and one number/);
  });

  test('logs in with correct credentials', async () => {
    const agent = request.agent(app);
    const res = await agent.post('/api/auth/login').send({ email, password: PASSWORD });
    expect(res.status).toBe(200);
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe(email);
  });

  test('rejects wrong password and unknown email with the same 401 message', async () => {
    const wrong = await request(app).post('/api/auth/login').send({ email, password: 'Wrongpass1' });
    const unknown = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'Wrongpass1' });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body.message).toBe(unknown.body.message);
  });

  test('protected routes require a valid session', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set('Authorization', 'Bearer not.a.jwt')).status).toBe(401);
    expect((await request(app).get('/api/swaps')).status).toBe(401);
    expect((await request(app).post('/api/listings').send({})).status).toBe(401);
    expect((await request(app).get('/api/users/me/dashboard')).status).toBe(401);
  });

  test('logout clears the session cookie', async () => {
    const { agent } = await registerAgent('Logout User');
    expect((await agent.get('/api/auth/me')).status).toBe(200);
    const out = await agent.post('/api/auth/logout');
    expect(out.status).toBe(200);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });

  test('suspended accounts cannot log in or use existing sessions', async () => {
    const { agent, user, email: e } = await registerAgent('Soon Suspended');
    await User.updateOne({ _id: user.id }, { status: 'suspended' });
    expect((await agent.get('/api/auth/me')).status).toBe(403);
    expect((await request(app).post('/api/auth/login').send({ email: e, password: PASSWORD })).status).toBe(403);
  });

  test('health check reports database connectivity', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.database).toBe('connected');
  });

  test('unknown API routes return JSON 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
