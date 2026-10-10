const express = require('express');
const mongoose = require('mongoose');
const { requireAuth, optionalAuth, requireAdmin } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { upload } = require('../middleware/upload');

const auth = require('../controllers/authController');
const listings = require('../controllers/listingController');
const swaps = require('../controllers/swapController');
const convos = require('../controllers/conversationController');
const users = require('../controllers/userController');
const images = require('../controllers/imageController');
const reports = require('../controllers/reportController');
const admin = require('../controllers/adminController');

const router = express.Router();

// Health check (used by Render) — also reports database connectivity.
router.get('/health', (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({ success: dbUp, status: dbUp ? 'ok' : 'degraded', database: dbUp ? 'connected' : 'disconnected', time: new Date().toISOString() });
});

// Auth
router.post('/auth/register', authLimiter, auth.register);
router.post('/auth/login', authLimiter, auth.login);
router.post('/auth/logout', auth.logout);
router.get('/auth/me', requireAuth, auth.me);

// Listings (order matters: static paths before /:id)
router.get('/listings/meta', listings.meta);
router.post('/listings/estimate', listings.estimate);
router.get('/listings/mine', requireAuth, listings.mine);
router.get('/listings/nearby', requireAuth, listings.nearby);
router.get('/listings', optionalAuth, listings.list);
router.post('/listings', requireAuth, listings.create);
router.get('/listings/:id', optionalAuth, listings.getOne);
router.get('/listings/:id/matches', requireAuth, listings.matches);
router.patch('/listings/:id', requireAuth, listings.update);
router.delete('/listings/:id', requireAuth, listings.remove);

// Images
router.post('/images', requireAuth, upload.array('images', 4), images.upload);
router.get('/images/:id', images.serve);

// Swaps
router.get('/swaps', requireAuth, swaps.list);
router.get('/swaps/suggestions', requireAuth, swaps.suggestions);
router.get('/swaps/compare', requireAuth, swaps.compare);
router.post('/swaps', requireAuth, swaps.create);
router.get('/swaps/:id', requireAuth, swaps.getOne);
router.post('/swaps/:id/accept', requireAuth, swaps.accept);
router.post('/swaps/:id/reject', requireAuth, swaps.reject);
router.post('/swaps/:id/cancel', requireAuth, swaps.cancel);
router.post('/swaps/:id/confirm', requireAuth, swaps.confirm);

// Negotiation chat
router.get('/conversations', requireAuth, convos.listConversations);
router.get('/swaps/:swapId/messages', requireAuth, convos.getMessages);
router.post('/swaps/:swapId/messages', requireAuth, convos.sendMessage);

// Users & profiles
router.get('/users/me/dashboard', requireAuth, users.dashboard);
router.patch('/users/me', requireAuth, users.updateMe);
router.patch('/users/me/password', requireAuth, users.changePassword);
router.get('/users/:id', users.publicProfile);

// Reports / disputes
router.post('/reports', requireAuth, reports.create);

// Administration (every route requires an authenticated admin)
router.use('/admin', requireAuth, requireAdmin);
router.get('/admin/stats', admin.stats);
router.get('/admin/users', admin.listUsers);
router.patch('/admin/users/:id/status', admin.setUserStatus);
router.get('/admin/listings', admin.listListings);
router.patch('/admin/listings/:id', admin.updateListing);
router.delete('/admin/listings/:id', admin.removeListing);
router.get('/admin/swaps', admin.listSwaps);
router.get('/admin/reports', admin.listReports);
router.patch('/admin/reports/:id', admin.resolveReport);

module.exports = router;
