const { app, request, startDB, stopDB, registerAgent, createListing, makeAdmin, PASSWORD } = require('./helpers');

beforeAll(startDB);
afterAll(stopDB);

describe('Administrator panel', () => {
  let admin;
  let customer;
  let other;
  let listing;

  beforeAll(async () => {
    admin = await registerAgent('Admin Asha');
    await makeAdmin(admin.user.id);
    customer = await registerAgent('Customer Chetan');
    other = await registerAgent('Customer Devika');
    listing = await createListing(customer.agent, { title: 'Questionable Scarf', category: 'accessories', clothingType: 'Scarf', brand: 'Gucci', size: 'Free Size' });
    const theirs = await createListing(other.agent, { title: 'Devika Dress', category: 'dresses', clothingType: 'Dress', brand: 'Zara', size: 'S' });
    await customer.agent.post('/api/swaps').send({ requestedListingId: theirs.id, offeredListingId: listing.id });
  });

  test('customers and anonymous users are blocked from admin routes', async () => {
    for (const path of ['/api/admin/stats', '/api/admin/users', '/api/admin/listings', '/api/admin/swaps', '/api/admin/reports']) {
      expect((await customer.agent.get(path)).status).toBe(403);
      expect((await request(app).get(path)).status).toBe(401);
    }
  });

  test('admin sees platform KPIs', async () => {
    const res = await admin.agent.get('/api/admin/stats');
    expect(res.status).toBe(200);
    const { kpis } = res.body.data;
    expect(kpis.totalListings).toBe(2);
    expect(kpis.totalUsers).toBe(2); // customers only
    expect(kpis.successfulSwaps).toBe(0);
    expect(kpis.swapConversionRate).toBe(0);
    expect(kpis.userEngagementRate).toBe(50); // 1 of 2 customers sent a request
    expect(res.body.data.swaps.total).toBe(1);
  });

  test('admin lists users (with private details) and swaps', async () => {
    const users = await admin.agent.get('/api/admin/users?q=chetan');
    expect(users.body.data.items).toHaveLength(1);
    expect(users.body.data.items[0].email).toBe(customer.email);
    expect(users.body.data.items[0].listingCount).toBe(1);
    const swaps = await admin.agent.get('/api/admin/swaps?status=pending');
    expect(swaps.body.data.items).toHaveLength(1);
  });

  test('users can file reports; admins resolve them', async () => {
    const rep = await other.agent.post('/api/reports').send({ targetType: 'listing', targetId: listing.id, reason: 'counterfeit', details: 'Looks fake' });
    expect(rep.status).toBe(201);
    const dup = await other.agent.post('/api/reports').send({ targetType: 'listing', targetId: listing.id, reason: 'counterfeit' });
    expect(dup.status).toBe(409);
    const bad = await other.agent.post('/api/reports').send({ targetType: 'listing', targetId: listing.id, reason: 'because' });
    expect(bad.status).toBe(400);

    const list = await admin.agent.get('/api/admin/reports?status=open');
    expect(list.body.data.items).toHaveLength(1);
    expect(list.body.data.items[0].target.label).toBe('Questionable Scarf');

    const resolved = await admin.agent.patch(`/api/admin/reports/${rep.body.data.report.id}`).send({ status: 'resolved', adminNote: 'Listing removed' });
    expect(resolved.status).toBe(200);
    expect(resolved.body.data.report.status).toBe('resolved');
  });

  test('admin can edit and remove inappropriate listings (open swaps are closed)', async () => {
    const edit = await admin.agent.patch(`/api/admin/listings/${listing.id}`).send({ title: 'Scarf (under review)' });
    expect(edit.status).toBe(200);
    expect(edit.body.data.listing.title).toBe('Scarf (under review)');

    const del = await admin.agent.delete(`/api/admin/listings/${listing.id}`).send({ reason: 'Counterfeit' });
    expect(del.status).toBe(200);
    expect((await request(app).get(`/api/listings/${listing.id}`)).status).toBe(404);
    const swaps = await customer.agent.get('/api/swaps?box=outgoing');
    expect(swaps.body.data.items[0].status).toBe('cancelled');
    expect((await admin.agent.delete('/api/admin/listings/64b7f0f0f0f0f0f0f0f0f0f0')).status).toBe(404);
  });

  test('admin can suspend and reactivate accounts', async () => {
    const sus = await admin.agent.patch(`/api/admin/users/${other.user.id}/status`).send({ status: 'suspended', reason: 'Spam' });
    expect(sus.status).toBe(200);
    expect(sus.body.data.user.status).toBe('suspended');
    expect((await other.agent.get('/api/auth/me')).status).toBe(403);
    expect((await request(app).post('/api/auth/login').send({ email: other.email, password: PASSWORD })).status).toBe(403);
    expect((await request(app).get(`/api/users/${other.user.id}`)).status).toBe(404); // hidden publicly

    const re = await admin.agent.patch(`/api/admin/users/${other.user.id}/status`).send({ status: 'active' });
    expect(re.status).toBe(200);
    expect((await other.agent.get('/api/auth/me')).status).toBe(200);
  });

  test('admin cannot suspend themselves or use invalid input', async () => {
    expect((await admin.agent.patch(`/api/admin/users/${admin.user.id}/status`).send({ status: 'suspended' })).status).toBe(400);
    expect((await admin.agent.patch(`/api/admin/users/${customer.user.id}/status`).send({ status: 'banished' })).status).toBe(400);
    expect((await admin.agent.patch('/api/admin/users/xyz/status').send({ status: 'active' })).status).toBe(400);
  });
});
