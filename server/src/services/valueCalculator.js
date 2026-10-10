/**
 * ReWear Swap Value Calculator — deterministic, rule-based (NOT AI/ML).
 *
 *   estimate = round10( categoryBase × brandMultiplier × conditionMultiplier )
 *
 * - categoryBase:        typical second-hand value of the category (catalog.js)
 * - brandMultiplier:     luxury 2.5 · premium 1.6 · mid-range 1.2 · other 1.0
 * - conditionMultiplier: new with tags 1.0 · like new 0.85 · good 0.65 · fair 0.45
 *
 * Owners may adjust the estimate by at most ±25% (OWNER_ADJUSTMENT_LIMIT) to
 * reflect things the formula can't see (rare print, extra accessories, etc.).
 * The server always recomputes and clamps — client values are never trusted.
 *
 * A pair is a "fair match" when the difference is within 20% of the higher
 * value, or at most ₹150 (FAIR_MATCH_PERCENT / FAIR_MATCH_ABSOLUTE).
 *
 * Values are ESTIMATED SWAP VALUES for comparison only — not prices. Users
 * always decide for themselves whether an exchange is worth it.
 */
const { CATEGORIES, CONDITIONS, BRAND_TIERS } = require('../config/catalog');

const OWNER_ADJUSTMENT_LIMIT = 0.25;
const FAIR_MATCH_PERCENT = 0.2;
const FAIR_MATCH_ABSOLUTE = 150;
const DEFAULT_BASE = 600;

function round10(n) {
  return Math.max(10, Math.round(n / 10) * 10);
}

function normaliseBrand(brand) {
  return String(brand || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function getBrandTier(brand) {
  const b = normaliseBrand(brand);
  for (const [tier, info] of Object.entries(BRAND_TIERS)) {
    if (info.brands.includes(b)) return { tier, label: info.label, multiplier: info.multiplier };
  }
  const s = BRAND_TIERS.standard;
  return { tier: 'standard', label: s.label, multiplier: s.multiplier };
}

function estimateValue({ category, brand, condition }) {
  const cat = CATEGORIES.find((c) => c.value === category);
  const cond = CONDITIONS.find((c) => c.value === condition);
  const baseValue = cat ? cat.baseValue : DEFAULT_BASE;
  const brandTier = getBrandTier(brand);
  const conditionMultiplier = cond ? cond.multiplier : 0.65;
  const value = round10(baseValue * brandTier.multiplier * conditionMultiplier);
  return {
    value,
    breakdown: {
      baseValue,
      brandTier: brandTier.tier,
      brandTierLabel: brandTier.label,
      brandMultiplier: brandTier.multiplier,
      conditionMultiplier,
    },
  };
}

/** Clamp an owner-requested value to ±25% of the calculated estimate. */
function resolveListingValue(calculatedValue, requestedValue) {
  const requested = Number(requestedValue);
  if (requestedValue === undefined || requestedValue === null || requestedValue === '' || !Number.isFinite(requested)) {
    return calculatedValue;
  }
  const min = round10(calculatedValue * (1 - OWNER_ADJUSTMENT_LIMIT));
  const max = round10(calculatedValue * (1 + OWNER_ADJUSTMENT_LIMIT));
  return Math.min(max, Math.max(min, round10(requested)));
}

function compareValues(offeredValue, requestedValue) {
  const a = Number(offeredValue) || 0;
  const b = Number(requestedValue) || 0;
  const difference = Math.abs(a - b);
  const higher = Math.max(a, b);
  const percentDifference = higher === 0 ? 0 : Math.round((difference / higher) * 100);
  const isFairMatch = difference <= FAIR_MATCH_ABSOLUTE || difference <= higher * FAIR_MATCH_PERCENT;
  let verdict;
  if (isFairMatch) verdict = 'Fair match';
  else if (a > b) verdict = 'Your offered item is worth noticeably more';
  else verdict = 'The requested item is worth noticeably more';
  return {
    offeredValue: a,
    requestedValue: b,
    difference,
    percentDifference,
    isFairMatch,
    verdict,
    note: 'Estimated swap values are suggestions only — both people decide whether the exchange is worth it.',
  };
}

module.exports = {
  estimateValue,
  resolveListingValue,
  compareValues,
  getBrandTier,
  OWNER_ADJUSTMENT_LIMIT,
  FAIR_MATCH_PERCENT,
  FAIR_MATCH_ABSOLUTE,
};
