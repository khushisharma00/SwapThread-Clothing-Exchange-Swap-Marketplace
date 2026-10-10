const { app, request, startDB, stopDB, registerAgent, createListing } = require('./helpers');

beforeAll(startDB);
afterAll(stopDB);

describe('Profiles, privacy and nearby swaps', () => {
  let delhi;
  let noida;
  let mumbai;
  let noCity;

  beforeAll(async () => {
    delhi = await registerAgent('Delhi Dev', 'New Delhi');
    noida = await registerAgent('Noida Nisha', 'Noida');
    mumbai = await registerAgent('Mumbai Manish', 'Mumbai');
    noCity = await registerAgent('No City Neel', undefined);
    await createListing(delhi.agent, { title: 'Delhi Jacket' }); // 1870
    await createListing(noida.agent, { title: 'Noida Jacket', condition: 'like_new' }); // 2450 — fair vs 1870? diff 580 > 490 → not fair
    await createListing(noida.agent, { title: 'Noida Coat', brand: 'Columbia', condition: 'good' }); // 1870 — fair
    await createListing(mumbai.agent, { title: 'Mumbai Jacket' }); // far away
  });

  test('users can update their own profile and location', async () => {
    const res = await delhi.agent.patch('/api/users/me').send({ bio: 'I love denim', phone: '+91 98765 43210', area: 'Saket', showArea: false, role: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.bio).toBe('I love denim');
    expect(res.body.data.user.phone).toBe('+91 98765 43210');
    expect(res.body.data.user.role).toBe('customer'); // cannot self-promote
    const bad = await delhi.agent.patch('/api/users/me').send({ city: 'Gotham', phone: 'call me maybe' });
    expect(bad.status).toBe(400);
  });

  test('public profile hides email, phone and private area', async () => {
    const res = await request(app).get(`/api/users/${delhi.user.id}`);
    expect(res.status).toBe(200);
    const u = res.body.data.user;
    expect(u.name).toBe('Delhi Dev');
    expect(u.location.city).toBe('New Delhi');
    expect(u.location.area).toBe(''); // showArea = false
    expect(u).not.toHaveProperty('email');
    expect(u).not.toHaveProperty('phone');
    expect(res.body.data.listings).toHaveLength(1);
    // Listing owner data is public-safe too
    expect(res.body.data.listings[0].owner).not.toHaveProperty('email');

    await delhi.agent.patch('/api/users/me').send({ showArea: true });
    const shown = await request(app).get(`/api/users/${delhi.user.id}`);
    expect(shown.body.data.user.location.area).toBe('Saket');
  });

  test('nearby returns close listings, fair suggestions and members — not far ones', async () => {
    const res = await delhi.agent.get('/api/listings/nearby?radiusKm=50');
    expect(res.status).toBe(200);
    const titles = res.body.data.items.map((i) => i.title);
    expect(titles).toEqual(expect.arrayContaining(['Noida Jacket', 'Noida Coat']));
    expect(titles).not.toContain('Mumbai Jacket');
    expect(titles).not.toContain('Delhi Jacket'); // own items excluded
    expect(res.body.data.suggestions.map((s) => s.theirItem.title)).toEqual(['Noida Coat']);
    expect(res.body.data.members.map((m) => m.member.name)).toEqual(['Noida Nisha']);
    expect(res.body.data.items[0].distanceLabel).toMatch(/km away/);

    const wide = await delhi.agent.get('/api/listings/nearby?radiusKm=2000');
    expect(wide.body.data.items.map((i) => i.title)).toContain('Mumbai Jacket');
  });

  test('nearby requires a saved city', async () => {
    const res = await noCity.agent.get('/api/listings/nearby');
    expect(res.status).toBe(400);
  });

  test('password change requires the current password', async () => {
    expect((await noida.agent.patch('/api/users/me/password').send({ currentPassword: 'Wrong123', newPassword: 'NewPassw0rd' })).status).toBe(400);
    expect((await noida.agent.patch('/api/users/me/password').send({ currentPassword: 'Passw0rd!', newPassword: 'NewPassw0rd' })).status).toBe(200);
    expect((await request(app).post('/api/auth/login').send({ email: noida.email, password: 'NewPassw0rd' })).status).toBe(200);
  });

  test('missing users return 404', async () => {
    expect((await request(app).get('/api/users/64b7f0f0f0f0f0f0f0f0f0f0')).status).toBe(404);
    expect((await request(app).get('/api/users/abc')).status).toBe(400);
  });
});
