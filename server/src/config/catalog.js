/**
 * Static catalog used by validation, the value calculator, seed data and the
 * client (served via GET /api/listings/meta). Keeping it in one place means
 * the frontend dropdowns and backend validation can never drift apart.
 */

const CATEGORIES = [
  { value: 'tops', label: 'Tops', baseValue: 500 },
  { value: 'shirts', label: 'Shirts', baseValue: 700 },
  { value: 'tshirts', label: 'T-Shirts', baseValue: 400 },
  { value: 'jeans', label: 'Jeans', baseValue: 1000 },
  { value: 'trousers', label: 'Trousers', baseValue: 800 },
  { value: 'dresses', label: 'Dresses', baseValue: 1200 },
  { value: 'jackets', label: 'Jackets & Coats', baseValue: 1800 },
  { value: 'sweaters', label: 'Sweaters & Hoodies', baseValue: 900 },
  { value: 'ethnic', label: 'Ethnic Wear', baseValue: 1500 },
  { value: 'activewear', label: 'Activewear', baseValue: 700 },
  { value: 'footwear', label: 'Footwear', baseValue: 1600 },
  { value: 'accessories', label: 'Accessories', baseValue: 500 },
];

const CONDITIONS = [
  { value: 'new_with_tags', label: 'New with tags', multiplier: 1.0 },
  { value: 'like_new', label: 'Like new', multiplier: 0.85 },
  { value: 'good', label: 'Good', multiplier: 0.65 },
  { value: 'fair', label: 'Fair', multiplier: 0.45 },
];

const SIZES = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL',
  '26', '28', '30', '32', '34', '36', '38',
  'UK 4', 'UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10',
  'Free Size',
];

const AUDIENCES = ['women', 'men', 'unisex', 'kids'];

/**
 * Brand tiers. Unknown brands fall back to "standard" (1.0).
 * Matching is case-insensitive on the normalised brand name.
 */
const BRAND_TIERS = {
  luxury: {
    label: 'Luxury',
    multiplier: 2.5,
    brands: ['gucci', 'prada', 'burberry', 'louis vuitton', 'coach', 'michael kors', 'sabyasachi', 'ralph lauren'],
  },
  premium: {
    label: 'Premium',
    multiplier: 1.6,
    brands: ['levi\'s', 'levis', 'tommy hilfiger', 'nike', 'adidas', 'zara', 'mango', 'fabindia', 'calvin klein', 'the north face', 'columbia', 'puma', 'u.s. polo assn.', 'jack & jones', 'woodland', 'converse', 'new balance'],
  },
  mid: {
    label: 'Mid-range',
    multiplier: 1.2,
    brands: ['h&m', 'uniqlo', 'biba', 'w', 'allen solly', 'van heusen', 'peter england', 'only', 'vero moda', 'forever 21', 'global desi', 'decathlon', 'bata', 'roadster', 'westside', 'marks & spencer'],
  },
  standard: { label: 'Standard', multiplier: 1.0, brands: [] },
};

/**
 * General locations (city-level only). Coordinates are city centroids, which
 * means distances are approximate by design: we never store or expose a
 * user's precise position.
 */
const CITIES = [
  { name: 'New Delhi', state: 'Delhi', lat: 28.6139, lng: 77.209 },
  { name: 'Gurugram', state: 'Haryana', lat: 28.4595, lng: 77.0266 },
  { name: 'Noida', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.391 },
  { name: 'Ghaziabad', state: 'Uttar Pradesh', lat: 28.6692, lng: 77.4538 },
  { name: 'Faridabad', state: 'Haryana', lat: 28.4089, lng: 77.3178 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { name: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.4867 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { name: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673 },
];

const LISTING_STATUSES = ['available', 'reserved', 'swapped', 'removed'];
const SWAP_STATUSES = ['pending', 'accepted', 'rejected', 'cancelled', 'completed'];

const categoryValues = CATEGORIES.map((c) => c.value);
const conditionValues = CONDITIONS.map((c) => c.value);
const cityNames = CITIES.map((c) => c.name);

function findCity(name) {
  if (!name) return null;
  const n = String(name).trim().toLowerCase();
  return CITIES.find((c) => c.name.toLowerCase() === n) || null;
}

module.exports = {
  CATEGORIES,
  CONDITIONS,
  SIZES,
  AUDIENCES,
  BRAND_TIERS,
  CITIES,
  LISTING_STATUSES,
  SWAP_STATUSES,
  categoryValues,
  conditionValues,
  cityNames,
  findCity,
};
