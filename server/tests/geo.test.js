const { distanceKm, distanceLabel, toGeoPoint, pointFromGeo } = require('../src/utils/geo');
const { findCity } = require('../src/config/catalog');

describe('Location utilities', () => {
  test('haversine distance between real cities is approximately correct', () => {
    const delhi = findCity('New Delhi');
    const mumbai = findCity('Mumbai');
    const noida = findCity('noida'); // case-insensitive lookup
    expect(Math.round(distanceKm(delhi, mumbai))).toBeGreaterThan(1100);
    expect(Math.round(distanceKm(delhi, mumbai))).toBeLessThan(1200);
    expect(distanceKm(delhi, noida)).toBeLessThan(25);
    expect(distanceKm(delhi, delhi)).toBe(0);
  });

  test('GeoJSON round-trip keeps [lng, lat] order', () => {
    const city = findCity('Pune');
    const geo = toGeoPoint(city);
    expect(geo.coordinates).toEqual([city.lng, city.lat]);
    expect(pointFromGeo(geo)).toEqual({ lat: city.lat, lng: city.lng });
  });

  test('distance labels are rounded for privacy', () => {
    expect(distanceLabel(2)).toBe('Same city');
    expect(distanceLabel(23)).toBe('~25 km away');
    expect(distanceLabel(1149)).toBe('~1150 km away');
    expect(distanceLabel(null)).toBeNull();
  });

  test('unknown cities are rejected', () => {
    expect(findCity('Atlantis')).toBeNull();
  });
});
