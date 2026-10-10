const { estimateValue, resolveListingValue, compareValues, getBrandTier } = require('../src/services/valueCalculator');

describe('Swap value calculator', () => {
  test('is deterministic: base × brand × condition, rounded to ₹10', () => {
    // jackets 1800 × premium 1.6 × good 0.65 = 1872 → 1870
    const a = estimateValue({ category: 'jackets', brand: "Levi's", condition: 'good' });
    const b = estimateValue({ category: 'jackets', brand: "Levi's", condition: 'good' });
    expect(a.value).toBe(1870);
    expect(b.value).toBe(a.value);
    expect(a.breakdown).toMatchObject({ baseValue: 1800, brandTier: 'premium', brandMultiplier: 1.6, conditionMultiplier: 0.65 });
  });

  test('brand tiers are case-insensitive and unknown brands are standard', () => {
    expect(getBrandTier('NIKE').tier).toBe('premium');
    expect(getBrandTier('  gucci ').tier).toBe('luxury');
    expect(getBrandTier('h&m').tier).toBe('mid');
    expect(getBrandTier('Some Local Label').tier).toBe('standard');
  });

  test('better condition never lowers the value', () => {
    const order = ['fair', 'good', 'like_new', 'new_with_tags'];
    const values = order.map((condition) => estimateValue({ category: 'dresses', brand: 'Zara', condition }).value);
    for (let i = 1; i < values.length; i += 1) expect(values[i]).toBeGreaterThan(values[i - 1]);
  });

  test('unknown category falls back to a default base value', () => {
    expect(estimateValue({ category: 'spacesuits', brand: '', condition: 'good' }).value).toBe(390); // 600 × 1 × 0.65
  });

  test('owner adjustment is clamped to ±25% of the calculated value', () => {
    expect(resolveListingValue(1000, 5000)).toBe(1250);
    expect(resolveListingValue(1000, 1)).toBe(750);
    expect(resolveListingValue(1000, 1100)).toBe(1100);
    expect(resolveListingValue(1000, undefined)).toBe(1000);
    expect(resolveListingValue(1000, 'abc')).toBe(1000);
  });

  test('compareValues reports difference and fair-match flag', () => {
    const fair = compareValues(1000, 1100);
    expect(fair).toMatchObject({ difference: 100, isFairMatch: true, verdict: 'Fair match' });
    expect(fair.note).toMatch(/suggestions only/);

    const unfair = compareValues(500, 2000);
    expect(unfair.difference).toBe(1500);
    expect(unfair.isFairMatch).toBe(false);
    expect(unfair.percentDifference).toBe(75);

    // Within ₹150 is always fair, even for cheap items.
    expect(compareValues(100, 240).isFairMatch).toBe(true);
    // Order of arguments does not change the absolute difference.
    expect(compareValues(2000, 500).difference).toBe(1500);
  });
});
