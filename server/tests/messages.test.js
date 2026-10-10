const { startDB, stopDB, registerAgent, createListing, makeAdmin } = require('./helpers');

beforeAll(startDB);
afterAll(stopDB);

describe('Negotiation chat', () => {
  let a;
  let b;
  let outsider;
  let admin;
  let swapId;

  beforeAll(async () => {
    a = await registerAgent('Chat Asha');
    b = await registerAgent('Chat Bilal');
    outsider = await registerAgent('Nosy Neha');
    admin = await registerAgent('Admin Arun');
    await makeAdmin(admin.user.id);
    const itemA = await createListing(a.agent, { title: 'Asha Kurta', category: 'ethnic', clothingType: 'Kurta', brand: 'Biba', size: 'M' });
    const itemB = await createListing(b.agent, { title: 'Bilal Shirt', category: 'shirts', clothingType: 'Shirt', brand: 'Zara', size: 'M' });
    const res = await a.agent.post('/api/swaps').send({ requestedListingId: itemB.id, offeredListingId: itemA.id, message: 'Hi Bilal!' });
    swapId = res.body.data.swap.id;
  });

  test('a conversation is created with the swap, including the opening message', async () => {
    const res = await b.agent.get(`/api/swaps/${swapId}/messages`);
    expect(res.status).toBe(200);
    expect(res.body.data.canSend).toBe(true);
    const bodies = res.body.data.messages.map((m) => m.body);
    expect(bodies.some((x) => /proposed swapping/.test(x))).toBe(true); // system message
    expect(bodies).toContain('Hi Bilal!');
  });

  test('both participants can send and read messages in order', async () => {
    const sent = await b.agent.post(`/api/swaps/${swapId}/messages`).send({ body: 'Hello! Can we meet on Saturday?' });
    expect(sent.status).toBe(201);
    expect(sent.body.data.message.mine).toBe(true);
    await new Promise((r) => setTimeout(r, 15)); // distinct timestamps for the ?after= check
    await a.agent.post(`/api/swaps/${swapId}/messages`).send({ body: 'Saturday works.' });

    const res = await a.agent.get(`/api/swaps/${swapId}/messages`);
    const userMsgs = res.body.data.messages.filter((m) => m.kind === 'user').map((m) => m.body);
    expect(userMsgs.slice(-2)).toEqual(['Hello! Can we meet on Saturday?', 'Saturday works.']);
    expect(res.body.data.messages.at(-1).mine).toBe(true);

    const after = await a.agent.get(`/api/swaps/${swapId}/messages?after=${encodeURIComponent(sent.body.data.message.createdAt)}`);
    expect(after.body.data.messages.map((m) => m.body)).toEqual(['Saturday works.']);
  });

  test('outsiders can neither read nor send', async () => {
    expect((await outsider.agent.get(`/api/swaps/${swapId}/messages`)).status).toBe(403);
    expect((await outsider.agent.post(`/api/swaps/${swapId}/messages`).send({ body: 'hi' })).status).toBe(403);
  });

  test('admins can read for dispute review but cannot post', async () => {
    expect((await admin.agent.get(`/api/swaps/${swapId}/messages`)).status).toBe(200);
    expect((await admin.agent.post(`/api/swaps/${swapId}/messages`).send({ body: 'admin here' })).status).toBe(403);
  });

  test('validates message content', async () => {
    expect((await a.agent.post(`/api/swaps/${swapId}/messages`).send({ body: '   ' })).status).toBe(400);
    expect((await a.agent.post(`/api/swaps/${swapId}/messages`).send({ body: 'x'.repeat(1001) })).status).toBe(400);
    expect((await a.agent.post(`/api/swaps/${swapId}/messages`).send({})).status).toBe(400);
    expect((await a.agent.post('/api/swaps/nope/messages').send({ body: 'hi' })).status).toBe(400);
    expect((await a.agent.post('/api/swaps/64b7f0f0f0f0f0f0f0f0f0f0/messages').send({ body: 'hi' })).status).toBe(404);
  });

  test('conversation list shows the other participant and last message', async () => {
    const res = await a.agent.get('/api/conversations');
    expect(res.status).toBe(200);
    const convo = res.body.data.items.find((c) => c.swapId === swapId);
    expect(convo.otherUser.name).toBe('Chat Bilal');
    expect(convo.lastMessagePreview).toBe('Saturday works.');
    expect(convo.otherUser).not.toHaveProperty('email');
  });

  test('conversation becomes read-only once the swap is closed', async () => {
    await b.agent.post(`/api/swaps/${swapId}/reject`);
    const res = await a.agent.get(`/api/swaps/${swapId}/messages`);
    expect(res.body.data.canSend).toBe(false);
    expect((await a.agent.post(`/api/swaps/${swapId}/messages`).send({ body: 'Please reconsider' })).status).toBe(409);
  });
});
