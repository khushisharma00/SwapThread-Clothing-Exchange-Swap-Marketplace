const Report = require('../models/Report');
const Listing = require('../models/Listing');
const User = require('../models/User');
const SwapRequest = require('../models/SwapRequest');
const { ApiError, asyncHandler } = require('../utils/ApiError');
const { validateBody, assertId } = require('../utils/validate');

exports.create = asyncHandler(async (req, res) => {
  const data = validateBody(req.body, {
    targetType: { type: 'enum', required: true, values: ['listing', 'user', 'swap'], label: 'Report type' },
    targetId: { type: 'string', required: true, label: 'Target' },
    reason: { type: 'enum', required: true, values: Report.REASONS, label: 'Reason' },
    details: { type: 'string', max: 1000, label: 'Details' },
  });
  assertId(data.targetId, 'target');

  if (data.targetType === 'listing') {
    if (!(await Listing.exists({ _id: data.targetId }))) throw ApiError.notFound('Listing not found');
  } else if (data.targetType === 'user') {
    if (data.targetId === req.user._id.toString()) throw ApiError.badRequest('You cannot report yourself');
    if (!(await User.exists({ _id: data.targetId }))) throw ApiError.notFound('User not found');
  } else {
    const swap = await SwapRequest.findById(data.targetId);
    if (!swap) throw ApiError.notFound('Swap not found');
    if (!swap.requester.equals(req.user._id) && !swap.owner.equals(req.user._id)) {
      throw ApiError.forbidden('You can only open a dispute for your own swaps');
    }
  }

  const open = await Report.exists({ reporter: req.user._id, targetType: data.targetType, targetId: data.targetId, status: 'open' });
  if (open) throw ApiError.conflict('You already have an open report for this. Our team will review it.');

  const report = await Report.create({ ...data, reporter: req.user._id });
  res.status(201).json({ success: true, data: { report: { id: report._id.toString(), status: report.status } } });
});
