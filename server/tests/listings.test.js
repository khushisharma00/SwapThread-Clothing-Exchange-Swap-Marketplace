const { app, request, startDB, stopDB, registerAgent, createListing, baseListing } = require('./helpers');

beforeAll(startDB);
afterAll(stopDB);

describe('Clothing listings', () => {
  let alice;
  let bob;
  let listing;

  beforeAll(async () => {
    alice = await registerAgent('Alice', 'New Delhi');
    bob = await registerAgent('Bob', 'Mumbai');
  });

  test('creates a listing with a server-computed estimated swap value', async () => {
    const res = await alice.agent.post('/api/listings').send({ ...baseListing, owner: '000000000000000000000000', estimatedValue: 99999, calculatedValue: 1 });
    expect(res.status).toBe(201);
    listing = res.body.data.listing;
    expect(listing.owner.id).toBe(alice.user.id); // owner comes from the session
    expect(listing.calculatedValue).toBe(1870); // jackets × premium × good
    expect(listing.estimatedValue).toBe(1870); // client value ignored
    expect(listing.status).toBe('available');
    expect(listing.location.city).toBe('New Delhi'); // defaults to the owner's city
  });

  test('owner value adjustment is clamped to ±25%', async () => {
    const res = await alice.agent.post('/api/listings').send({ ...baseListing, title: 'Adjusted jacket', requestedValue: 100000 });
    expect(res.status).toBe(201);
    expect(res.body.data.listing.estimatedValue).toBe(2340); // 1870 × 1.25 = 2337.5 → 2340
  });

  test('validates listing input', async () => {
    const res = await alice.agent.post('/api/listings').send({ title: 'x', category: 'spaceships', condition: 'perfect', size: 'XXXXL' });
    expect(res.status).toBe(400);
    for (const field of ['title', 'description', 'category', 'clothingType', 'brand', 'size', 'condition']) {
      expect(res.body.errors).toHaveProperty(field);
    }
  });

  test('requires authentication to create', async () => {
    const res = await request(app).post('/api/listings').send(baseListing);
    expect(res.status).toBe(401);
  });

  test('owner can edit; value is recalculated', async () => {
    const res = await alice.agent.patch(`/api/listings/${listing.id}`).send({ condition: 'new_with_tags', title: 'Classic Denim Jacket (NWT)' });
    expect(res.status).toBe(200);
    expect(res.body.data.listing.title).toBe('Classic Denim Jacket (NWT)');
    expect(res.body.data.listing.calculatedValue).toBe(2880); // 1800 × 1.6 × 1.0
  });

  test("users cannot edit or delete someone else's listing", async () => {
    expect((await bob.agent.patch(`/api/listings/${listing.id}`).send({ title: 'Hacked title' })).status).toBe(403);
    expect((await bob.agent.delete(`/api/listings/${listing.id}`)).status).toBe(403);
  });

  test('handles invalid and missing ids', async () => {
    expect((await request(app).get('/api/listings/not-an-id')).status).toBe(400);
    expect((await request(app).get('/api/listings/64b7f0f0f0f0f0f0f0f0f0f0')).status).toBe(404);
    expect((await alice.agent.patch('/api/listings/64b7f0f0f0f0f0f0f0f0f0f0').send({ title: 'Nothing here' })).status).toBe(404);
  });

  describe('search, filtering and sorting', () => {
    beforeAll(async () => {
      await createListing(bob.agent, { title: 'Nike Air Max 270', category: 'footwear', clothingType: 'Sneakers', brand: 'Nike', size: 'UK 9', condition: 'like_new', color: 'Black' });
      await createListing(bob.agent, { title: 'Floral Midi Dress', category: 'dresses', clothingType: 'Midi dress', brand: 'Zara', size: 'S', condition: 'good', color: 'Pink' });
      await createListing(alice.agent, { title: 'Cotton Kurta', category: 'ethnic', clothingType: 'Kurta', brand: 'Fabindia', size: 'M', condition: 'fair', color: 'White' });
    });

    test('keyword search matches title and brand (case-insensitive)', async () => {
      const byBrand = await request(app).get('/api/listings?q=nike');
      expect(byBrand.body.data.items.map((i) => i.title)).toEqual(['Nike Air Max 270']);
      const byTitle = await request(app).get('/api/listings?q=KURTA');
      expect(byTitle.body.data.items).toHaveLength(1);
    });

    test('search input is treated as text, not a regex', async () => {
      const res = await request(app).get('/api/listings?q=.*(');
      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(0);
    });

    test('filters by category, size, condition and city', async () => {
      const cat = await request(app).get('/api/listings?category=dresses');
      expect(cat.body.data.items.every((i) => i.category === 'dresses')).toBe(true);
      expect(cat.body.data.items).toHaveLength(1);

      const size = await request(app).get('/api/listings?size=UK%209');
      expect(size.body.data.items.map((i) => i.title)).toEqual(['Nike Air Max 270']);

      const cond = await request(app).get('/api/listings?condition=fair');
      expect(cond.body.data.items.map((i) => i.title)).toEqual(['Cotton Kurta']);

      const city = await request(app).get('/api/listings?city=Mumbai');
      expect(city.body.data.items).toHaveLength(2);
      expect(city.body.data.items.every((i) => i.location.city === 'Mumbai')).toBe(true);
    });

    test('filters by distance radius around a city', async () => {
      const near = await request(app).get('/api/listings?city=Noida&radiusKm=50');
      expect(near.status).toBe(200);
      expect(near.body.data.items.length).toBeGreaterThan(0);
      expect(near.body.data.items.every((i) => i.location.city === 'New Delhi')).toBe(true);
      expect(near.body.data.items[0].distanceLabel).toMatch(/km away|Same city/);

      const bad = await request(app).get('/api/listings?radiusKm=50');
      expect(bad.status).toBe(400); // anonymous user with no city
    });

    test('sorts by estimated value', async () => {
      const asc = await request(app).get('/api/listings?sort=value_asc');
      const values = asc.body.data.items.map((i) => i.estimatedValue);
      expect(values).toEqual([...values].sort((a, b) => a - b));
      const desc = await request(app).get('/api/listings?sort=value_desc');
      expect(desc.body.data.items[0].estimatedValue).toBe(Math.max(...values));
    });

    test('paginates results', async () => {
      const res = await request(app).get('/api/listings?limit=2&page=1');
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.total).toBeGreaterThanOrEqual(5);
      expect(res.body.data.totalPages).toBeGreaterThanOrEqual(3);
    });
  });

  test('meta and estimate endpoints expose the catalog and calculator', async () => {
    const meta = await request(app).get('/api/listings/meta');
    expect(meta.body.data.categories.length).toBeGreaterThan(5);
    expect(meta.body.data.cities.find((c) => c.name === 'New Delhi')).toBeTruthy();
    const est = await request(app).post('/api/listings/estimate').send({ category: 'jeans', brand: 'H&M', condition: 'like_new' });
    expect(est.status).toBe(200);
    expect(est.body.data.value).toBe(1020); // 1000 × 1.2 × 0.85
  });

  test('owner can delete; listing disappears from browse and returns 404 to others', async () => {
    const res = await alice.agent.delete(`/api/listings/${listing.id}`);
    expect(res.status).toBe(200);
    expect((await request(app).get(`/api/listings/${listing.id}`)).status).toBe(404);
    const all = await request(app).get('/api/listings?limit=48');
    expect(all.body.data.items.find((i) => i.id === listing.id)).toBeUndefined();
    expect((await alice.agent.delete(`/api/listings/${listing.id}`)).status).toBe(404);
  });

  test('image upload rejects non-images and accepts a real PNG', async () => {
    const bad = await alice.agent.post('/api/images').attach('images', Buffer.from('not really an image'), { filename: 'x.png', contentType: 'image/png' });
    expect(bad.status).toBe(400);

    // Smallest valid 1×1 PNG
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    const ok = await alice.agent.post('/api/images').attach('images', png, { filename: 'shirt.png', contentType: 'image/png' });
    expect(ok.status).toBe(201);
    const { id, url } = ok.body.data.images[0];
    const served = await request(app).get(url);
    expect(served.status).toBe(200);
    expect(served.headers['content-type']).toBe('image/png');

    // Images can be attached only by their uploader
    const steal = await bob.agent.post('/api/listings').send({ ...baseListing, images: [id] });
    expect(steal.status).toBe(400);
    const own = await alice.agent.post('/api/listings').send({ ...baseListing, title: 'With photo', images: [id] });
    expect(own.status).toBe(201);
    expect(own.body.data.listing.images).toEqual([url]);
  });
});
