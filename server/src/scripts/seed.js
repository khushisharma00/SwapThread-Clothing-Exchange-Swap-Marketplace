/**
 * Seeds the database with realistic demo users, listings, swaps and chats.
 *
 *   npm run seed              → adds demo data (refuses if demo users already exist)
 *   npm run seed -- --reset   → DELETES ALL DATA (except admin accounts) and re-seeds
 *
 * Demo customer password: taken from SEED_USER_PASSWORD, otherwise a random
 * password is generated and printed once. No admin is created here — use
 * `npm run create-admin` so no admin password is ever hard-coded.
 */
const crypto = require('crypto');
const env = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Image = require('../models/Image');
const SwapRequest = require('../models/SwapRequest');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Report = require('../models/Report');
const { findCity } = require('../config/catalog');
const { toGeoPoint } = require('../utils/geo');
const { estimateValue } = require('../services/valueCalculator');
const { garmentSvg } = require('../services/garmentArt');
const swapService = require('../services/swapService');
const seedData = require('../data/seedData');

async function seed({ reset = false, password } = {}) {
  if (reset) {
    await Promise.all([
      User.deleteMany({ role: { $ne: 'admin' } }),
      Listing.deleteMany({}),
      Image.deleteMany({}),
      SwapRequest.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
      Report.deleteMany({}),
    ]);
  } else if (await User.exists({ email: seedData.users[0].email })) {
    throw new Error('Demo data already exists. Run "npm run seed -- --reset" to wipe and re-seed.');
  }

  const demoPassword = password || process.env.SEED_USER_PASSWORD || `Swap-${crypto.randomBytes(4).toString('hex')}1`;

  const users = [];
  for (const u of seedData.users) {
    const city = findCity(u.city);
    const user = new User({
      name: u.name,
      email: u.email,
      bio: u.bio,
      role: 'customer',
      location: { city: city.name, state: city.state, area: u.area, showArea: u.showArea },
      geo: toGeoPoint(city),
      lastActiveAt: new Date(Date.now() - Math.floor(Math.random() * 20) * 24 * 3600 * 1000),
    });
    await user.setPassword(demoPassword);
    await user.save();
    users.push(user);
  }

  const listings = [];
  let i = 0;
  for (const [ownerIdx, title, category, clothingType, audience, brand, size, condition, color, description] of seedData.listings) {
    const owner = users[ownerIdx];
    const city = findCity(owner.location.city);
    const imgs = await Image.insertMany(
      [0, 1].map((variant) => {
        const svg = garmentSvg({ category, color, brand, title }, variant);
        return { data: Buffer.from(svg, 'utf8'), contentType: 'image/svg+xml', size: Buffer.byteLength(svg), owner: owner._id, generated: true };
      })
    );
    const est = estimateValue({ category, brand, condition });
    const listing = await Listing.create({
      title, description, category, clothingType, audience, brand, size, condition, color,
      calculatedValue: est.value,
      estimatedValue: est.value,
      valueBreakdown: est.breakdown,
      images: imgs.map((x) => x._id),
      owner: owner._id,
      location: { city: city.name, state: city.state },
      geo: toGeoPoint(city),
      views: 5 + ((i * 7) % 40),
      createdAt: new Date(Date.now() - i * 5 * 3600 * 1000),
    });
    listings.push(listing);
    i += 1;
  }

  const byTitle = (t) => listings.find((l) => l.title === t);
  const say = async (swapId, user, body) => {
    const convo = await Conversation.findOne({ swap: swapId });
    await Message.create({ conversation: convo._id, sender: user._id, body });
    convo.lastMessageAt = new Date();
    convo.lastMessagePreview = body.slice(0, 120);
    await convo.save();
  };

  // 1) Completed swap: Rohan ↔ Priya
  const s1 = await swapService.createSwap({ requester: users[1], requestedListingId: byTitle('Only Denim Jacket')._id.toString(), offeredListingId: byTitle('Adidas Essentials Hoodie')._id.toString(), message: 'Hi Priya! Would you swap your denim jacket for my Adidas hoodie?', exchangeMethod: 'meetup' });
  await say(s1._id, users[2], 'Sure! Can we meet at Botanical Garden metro on Saturday?');
  await swapService.acceptSwap(s1._id, users[2]);
  await say(s1._id, users[1], 'Perfect, see you at 11am.');
  await swapService.confirmSwap(s1._id, users[1]);
  await swapService.confirmSwap(s1._id, users[2]);

  // 2) Accepted swap in progress: Ananya ↔ Vikram
  const s2 = await swapService.createSwap({ requester: users[0], requestedListingId: byTitle("Levi's Trucker Jacket")._id.toString(), offeredListingId: byTitle("Levi's 511 Slim Jeans")._id.toString(), message: 'Levi\'s for Levi\'s? My 511s are almost new.', exchangeMethod: 'courier' });
  await say(s2._id, users[7], 'Deal. I can ship by courier on Monday — split the cost?');
  await swapService.acceptSwap(s2._id, users[7]);
  await say(s2._id, users[0], 'Yes, works for me. Sending my address details here once you confirm the courier.');

  // 3) Pending requests (incoming for several users)
  const s3 = await swapService.createSwap({ requester: users[2], requestedListingId: byTitle('Zara Linen Blend Shirt')._id.toString(), offeredListingId: byTitle('Van Heusen Blazer')._id.toString(), message: 'Love this shirt! Interested in my blazer?', exchangeMethod: 'meetup' });
  await say(s3._id, users[0], 'Hmm, could you share another photo of the blazer lining?');
  await swapService.createSwap({ requester: users[3], requestedListingId: byTitle('Nike Air Max 270')._id.toString(), offeredListingId: byTitle('Woodland Leather Boots')._id.toString(), message: 'Boots for sneakers? Both great condition.', exchangeMethod: 'courier' });
  await swapService.createSwap({ requester: users[6], requestedListingId: byTitle('W Floral Maxi Dress')._id.toString(), offeredListingId: byTitle('Vero Moda High-Rise Jeans')._id.toString(), message: 'Would you consider these jeans for the maxi dress?', exchangeMethod: 'courier' });

  // 4) Rejected request
  const s6 = await swapService.createSwap({ requester: users[5], requestedListingId: byTitle('The North Face Puffer Jacket')._id.toString(), offeredListingId: byTitle('Roadster Checked Shirt')._id.toString(), message: 'Any chance you would swap?', exchangeMethod: 'courier' });
  await swapService.rejectSwap(s6._id, users[3], 'Sorry, the values are too far apart.');

  // 5) A report for the admin queue
  await Report.create({ reporter: users[4]._id, targetType: 'listing', targetId: byTitle('Gucci Silk Scarf')._id, reason: 'counterfeit', details: 'Please verify authenticity — the price seems too good to be true.' });

  return { users: users.length, listings: listings.length, password: demoPassword };
}

if (require.main === module) {
  (async () => {
    const reset = process.argv.includes('--reset');
    try {
      await connectDB(env.MONGODB_URI);
      const res = await seed({ reset });
      console.log(`✔ Seeded ${res.users} demo users and ${res.listings} listings (with swaps, chats and a report).`);
      console.log('  Demo login: ananya@demo.rewear.app (or any *@demo.rewear.app email from src/data/seedData.js)');
      console.log(`  Demo password: ${res.password}`);
      console.log('  Create an administrator with: npm run create-admin');
    } catch (err) {
      console.error(`✖ Seeding failed: ${err.message}`);
      process.exitCode = 1;
    } finally {
      await disconnectDB();
    }
  })();
}

module.exports = { seed };
