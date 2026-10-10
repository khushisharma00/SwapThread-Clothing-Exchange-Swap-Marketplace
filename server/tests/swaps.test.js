const { startDB, stopDB, registerAgent, createListing } = require('./helpers');

beforeAll(startDB);
afterAll(stopDB);

describe('Swap requests', () => {
  let owner; // owns the jacket
  let requester; // offers jeans
  let third; // competing requester
  let jacket;
  let jeans;
  let sneakers;
  let swap;

  beforeAll(async () => {
    owner = await registerAgent('Owner Olivia', 'New Delhi');
    requester = await registerAgent('Requester Raj', 'Gurugram');
    third = await registerAgent('Third Tara', 'Noida');
    jacket = await createListing(owner.agent, { title: 'Denim Jacket', brand: "Levi's", category: 'jackets', condition: 'good' }); // 1870
    jeans = await createListing(requester.agent, { title: 'Slim Jeans', category: 'jeans', clothingType: 'Jeans', brand: "Levi's", size: '32', condition: 'like_new' }); // 1000×1.6×0.85 = 1360
    sneakers = await createListing(third.agent, { title: 'Running Sneakers', category: 'footwear', clothingType: 'Sneakers', brand: 'Nike', size: 'UK 9', condition: 'like_new' }); // 1600×1.6×0.85 = 2176 → 2180
  });

  test('creates a swap request with server-side value comparison', async () => {
    const res = await requester.agent.post('/api/swaps').send({
      requestedListingId: jacket.id,
      offeredListingId: jeans.id,
      message: 'Would you swap?',
      offeredValue: 999999, // must be ignored
    });
    expect(res.status).toBe(201);
    swap = res.body.data.swap;
    expect(swap.status).toBe('pending');
    expect(swap.direction).toBe('outgoing');
    expect(swap.offeredValue).toBe(1360);
    expect(swap.requestedValue).toBe(1870);
    expect(swap.valueDifference).toBe(510);
    expect(swap.isFairMatch).toBe(false); // 510 > 20% of 1870 (374)
  });

  test('prevents requesting your own item', async () => {
    const other = await createListing(owner.agent, { title: 'Owner second item', category: 'tops', clothingType: 'Top', brand: 'Zara', size: 'S' });
    const res = await owner.agent.post('/api/swaps').send({ requestedListingId: jacket.id, offeredListingId: other.id });
    expect(res.status).toBe(400);
  });

  test("prevents offering an item you don't own", async () => {
    const res = await third.agent.post('/api/swaps').send({ requestedListingId: jacket.id, offeredListingId: jeans.id });
    expect(res.status).toBe(403);
  });

  test('prevents duplicate open requests for the same item', async () => {
    const res = await requester.agent.post('/api/swaps').send({ requestedListingId: jacket.id, offeredListingId: jeans.id });
    expect(res.status).toBe(409);
  });

  test('validates ids and missing listings', async () => {
    expect((await requester.agent.post('/api/swaps').send({ requestedListingId: 'bad', offeredListingId: jeans.id })).status).toBe(400);
    expect((await requester.agent.post('/api/swaps').send({ requestedListingId: '64b7f0f0f0f0f0f0f0f0f0f0', offeredListingId: jeans.id })).status).toBe(404);
    expect((await requester.agent.post('/api/swaps').send({})).status).toBe(400);
  });

  test('shows the request as incoming for the owner and outgoing for the requester', async () => {
    const inc = await owner.agent.get('/api/swaps?box=incoming');
    expect(inc.body.data.items.map((s) => s.id)).toContain(swap.id);
    expect(inc.body.data.items[0].direction).toBe('incoming');
    const out = await requester.agent.get('/api/swaps?box=outgoing');
    expect(out.body.data.items.map((s) => s.id)).toContain(swap.id);
    const outsider = await third.agent.get(`/api/swaps/${swap.id}`);
    expect(outsider.status).toBe(403);
  });

  test('only the owner can accept', async () => {
    expect((await requester.agent.post(`/api/swaps/${swap.id}/accept`)).status).toBe(403);
    expect((await third.agent.post(`/api/swaps/${swap.id}/accept`)).status).toBe(403);
  });

  test('accepting reserves both items and auto-closes conflicting requests', async () => {
    // A competing request for the same jacket
    const competing = await third.agent.post('/api/swaps').send({ requestedListingId: jacket.id, offeredListingId: sneakers.id });
    expect(competing.status).toBe(201);

    const res = await owner.agent.post(`/api/swaps/${swap.id}/accept`);
    expect(res.status).toBe(200);
    expect(res.body.data.swap.status).toBe('accepted');

    const j = await owner.agent.get(`/api/listings/${jacket.id}`);
    expect(j.body.data.listing.status).toBe('reserved');
    const je = await owner.agent.get(`/api/listings/${jeans.id}`);
    expect(je.body.data.listing.status).toBe('reserved');

    const c = await third.agent.get(`/api/swaps/${competing.body.data.swap.id}`);
    expect(c.body.data.swap.status).toBe('cancelled');
    // The competitor's sneakers stay available
    const s = await third.agent.get(`/api/listings/${sneakers.id}`);
    expect(s.body.data.listing.status).toBe('available');
  });

  test('cannot accept twice or request a reserved item', async () => {
    expect((await owner.agent.post(`/api/swaps/${swap.id}/accept`)).status).toBe(409);
    const res = await third.agent.post('/api/swaps').send({ requestedListingId: jacket.id, offeredListingId: sneakers.id });
    expect(res.status).toBe(409);
  });

  test('reserved listings cannot be edited or deleted', async () => {
    expect((await owner.agent.patch(`/api/listings/${jacket.id}`).send({ title: 'Changed title' })).status).toBe(409);
    expect((await owner.agent.delete(`/api/listings/${jacket.id}`)).status).toBe(409);
  });

  test('completes only after BOTH people confirm; items become swapped', async () => {
    const first = await requester.agent.post(`/api/swaps/${swap.id}/confirm`);
    expect(first.status).toBe(200);
    expect(first.body.data.swap.status).toBe('accepted');
    expect(first.body.data.swap.requesterConfirmed).toBe(true);

    const second = await owner.agent.post(`/api/swaps/${swap.id}/confirm`);
    expect(second.body.data.swap.status).toBe('completed');

    const j = await owner.agent.get(`/api/listings/${jacket.id}`);
    expect(j.body.data.listing.status).toBe('swapped');
    const dash = await owner.agent.get('/api/users/me/dashboard');
    expect(dash.body.data.stats.completedSwaps).toBe(1);
    expect(dash.body.data.user.swapsCompleted).toBe(1);

    expect((await owner.agent.post(`/api/swaps/${swap.id}/cancel`)).status).toBe(409);
  });

  test('reject flow', async () => {
    const shirt = await createListing(owner.agent, { title: 'Oxford Shirt', category: 'shirts', clothingType: 'Shirt', brand: 'Ralph Lauren', size: 'M' });
    const req = await third.agent.post('/api/swaps').send({ requestedListingId: shirt.id, offeredListingId: sneakers.id });
    expect(req.status).toBe(201);
    const id = req.body.data.swap.id;
    expect((await third.agent.post(`/api/swaps/${id}/reject`)).status).toBe(403); // requester cannot reject
    const rej = await owner.agent.post(`/api/swaps/${id}/reject`).send({ note: 'Not my size' });
    expect(rej.status).toBe(200);
    expect(rej.body.data.swap.status).toBe('rejected');
    expect((await owner.agent.post(`/api/swaps/${id}/accept`)).status).toBe(409);
    // After rejection, a fresh request is allowed again
    const again = await third.agent.post('/api/swaps').send({ requestedListingId: shirt.id, offeredListingId: sneakers.id });
    expect(again.status).toBe(201);
  });

  test('cancelling an accepted swap releases both items', async () => {
    const tee = await createListing(owner.agent, { title: 'Logo Tee', category: 'tshirts', clothingType: 'T-shirt', brand: 'Nike', size: 'M' });
    const hoodie = await createListing(requester.agent, { title: 'Grey Hoodie', category: 'sweaters', clothingType: 'Hoodie', brand: 'Adidas', size: 'L' });
    const req = await requester.agent.post('/api/swaps').send({ requestedListingId: tee.id, offeredListingId: hoodie.id });
    const id = req.body.data.swap.id;
    await owner.agent.post(`/api/swaps/${id}/accept`);
    const cancel = await owner.agent.post(`/api/swaps/${id}/cancel`).send({ note: 'Changed my mind' });
    expect(cancel.status).toBe(200);
    expect(cancel.body.data.swap.status).toBe('cancelled');
    expect((await owner.agent.get(`/api/listings/${tee.id}`)).body.data.listing.status).toBe('available');
    expect((await owner.agent.get(`/api/listings/${hoodie.id}`)).body.data.listing.status).toBe('available');
  });

  test('suggestions and value comparison endpoints', async () => {
    const sug = await requester.agent.get('/api/swaps/suggestions');
    expect(sug.status).toBe(200);
    expect(Array.isArray(sug.body.data.items)).toBe(true);
    for (const item of sug.body.data.items) expect(item.comparison.isFairMatch).toBe(true);

    const cmp = await requester.agent.get(`/api/swaps/compare?offered=${jeans.id}&requested=${sneakers.id}`);
    expect(cmp.status).toBe(200);
    expect(cmp.body.data.difference).toBe(Math.abs(1360 - 2180));
  });
});
