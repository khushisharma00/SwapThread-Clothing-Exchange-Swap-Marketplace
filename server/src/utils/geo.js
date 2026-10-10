const EARTH_RADIUS_KM = 6371;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance in km between two {lat, lng} points (haversine). */
function distanceKm(a, b) {
  if (!a || !b) return null;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** GeoJSON coordinates are [lng, lat]. */
function pointFromGeo(geo) {
  if (!geo || !Array.isArray(geo.coordinates) || geo.coordinates.length !== 2) return null;
  return { lng: geo.coordinates[0], lat: geo.coordinates[1] };
}

function toGeoPoint(city) {
  return { type: 'Point', coordinates: [city.lng, city.lat] };
}

/** Rounded, privacy-friendly distance label. */
function distanceLabel(km) {
  if (km === null || km === undefined) return null;
  if (km < 5) return 'Same city';
  if (km < 50) return `~${Math.round(km / 5) * 5} km away`;
  return `~${Math.round(km / 10) * 10} km away`;
}

module.exports = { distanceKm, pointFromGeo, toGeoPoint, distanceLabel, EARTH_RADIUS_KM };
