/**
 * Generates clean, on-brand SVG illustrations for seed listings so the demo
 * never shows broken image links and needs no third-party image licensing.
 * Real users upload their own photos (JPEG/PNG/WebP).
 */

const SHAPES = {
  // Shirt / top silhouette
  top: 'M210 170 L265 140 Q300 175 335 140 L390 170 L460 240 L420 290 L390 265 L390 600 L210 600 L210 265 L180 290 L140 240 Z',
  // Jacket with opening
  jacket: 'M200 165 L262 135 L300 230 L338 135 L400 165 L470 250 L470 560 L420 560 L420 300 L400 290 L400 610 L200 610 L200 290 L180 300 L180 560 L130 560 L130 250 Z',
  // Trousers / jeans
  pants: 'M215 150 L385 150 L400 620 L320 620 L300 300 L280 620 L200 620 Z',
  // Dress
  dress: 'M250 140 L280 140 Q300 170 320 140 L350 140 L365 250 L345 290 L440 620 L160 620 L255 290 L235 250 Z',
  // Shoe
  shoe: 'M150 470 L170 360 Q200 330 250 360 L300 400 Q360 430 440 440 Q480 450 470 500 L470 520 L150 520 Z',
  // Bag
  bag: 'M180 300 L420 300 L450 590 L150 590 Z M240 300 Q240 210 300 210 Q360 210 360 300 L340 300 Q340 235 300 235 Q260 235 260 300 Z',
};

const CATEGORY_SHAPE = {
  tops: 'top', shirts: 'top', tshirts: 'top', sweaters: 'top', activewear: 'top',
  jackets: 'jacket', jeans: 'pants', trousers: 'pants', dresses: 'dress', ethnic: 'dress',
  footwear: 'shoe', accessories: 'bag',
};

const COLOR_MAP = {
  black: '#2b2b2b', white: '#f4f1ea', cream: '#efe6d2', beige: '#d8c7a3', navy: '#27375a', blue: '#4a6fa5',
  'light blue': '#8fb3d9', denim: '#46628a', indigo: '#33426b', green: '#4f7a5a', olive: '#6b6b3a', khaki: '#b3a477',
  red: '#b5413a', maroon: '#6e2a33', pink: '#e2a4b3', mustard: '#d1a33a', yellow: '#e6c75a', brown: '#7a5236',
  tan: '#b98a5c', grey: '#8a8d91', gray: '#8a8d91', charcoal: '#3d3f43', purple: '#6c4f8a', orange: '#d9773a', teal: '#2f7a7a',
  multicolour: '#a86a4c', floral: '#c77a8a', silver: '#b8bcc2', gold: '#c9a54a',
};

function pickColor(color) {
  const c = String(color || '').toLowerCase();
  for (const [k, v] of Object.entries(COLOR_MAP)) if (c.includes(k)) return v;
  return '#4f7a5a';
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/** variant 0 = full garment view, 1 = detail/label view */
function garmentSvg({ category, color, brand, title }, variant = 0) {
  const fill = pickColor(color);
  const shape = SHAPES[CATEGORY_SHAPE[category] || 'top'];
  const bg = variant === 0 ? '#f3eee3' : '#e7efe8';
  if (variant === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="600" height="750">
  <rect width="600" height="750" fill="${bg}"/>
  <circle cx="300" cy="380" r="250" fill="${shade(bg, -10)}"/>
  <g transform="translate(0,10)">
    <path d="${shape}" fill="${shade(fill, -30)}" transform="translate(8,10)" opacity="0.35"/>
    <path d="${shape}" fill="${fill}" stroke="${shade(fill, -45)}" stroke-width="4" stroke-linejoin="round"/>
  </g>
  <text x="300" y="705" text-anchor="middle" font-family="Georgia, serif" font-size="26" fill="#2c3a33">${esc(String(brand).slice(0, 28))}</text>
</svg>`;
  }
  // Detail view: fabric swatch + brand label
  const stripes = Array.from({ length: 14 }, (_, i) => `<rect x="${i * 46}" y="0" width="22" height="750" fill="${shade(fill, i % 2 ? -12 : 10)}" opacity="0.35"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="600" height="750">
  <rect width="600" height="750" fill="${fill}"/>
  ${stripes}
  <rect x="150" y="250" width="300" height="200" rx="14" fill="#fbf8f1" stroke="#2c3a33" stroke-width="3"/>
  <text x="300" y="335" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="#2c3a33">${esc(String(brand).slice(0, 18))}</text>
  <text x="300" y="385" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="18" fill="#5b6b61">${esc(String(title).slice(0, 30))}</text>
  <text x="300" y="690" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="20" fill="#fbf8f1">detail view</text>
</svg>`;
}

module.exports = { garmentSvg };
