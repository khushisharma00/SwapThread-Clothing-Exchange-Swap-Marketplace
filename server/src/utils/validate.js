const { ApiError } = require('./ApiError');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isValidId(id) {
  return typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id);
}

function assertId(id, label = 'id') {
  if (!isValidId(id)) throw ApiError.badRequest(`Invalid ${label}`);
}

/**
 * Tiny schema validator. Each rule: { type: 'string'|'number'|'boolean'|'enum'|'email'|'ids',
 * required, min, max, values, trim }. Unknown keys in the body are dropped, which also
 * prevents mass-assignment of fields like `role`, `owner` or `estimatedValue`.
 */
function validateBody(body, rules, { partial = false } = {}) {
  const errors = {};
  const out = {};
  const src = body && typeof body === 'object' ? body : {};

  for (const [key, rule] of Object.entries(rules)) {
    let v = src[key];
    const missing = v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
    if (missing) {
      if (rule.required && !partial) errors[key] = `${rule.label || key} is required`;
      else if (rule.required && partial && key in src) errors[key] = `${rule.label || key} cannot be empty`;
      else if (!rule.required && rule.type === 'string' && typeof v === 'string') out[key] = ''; // allow clearing optional text
      continue;
    }
    switch (rule.type) {
      case 'string':
      case 'email': {
        if (typeof v !== 'string') { errors[key] = `${rule.label || key} must be text`; break; }
        v = v.trim();
        if (rule.type === 'email') {
          v = v.toLowerCase();
          if (!EMAIL_RE.test(v) || v.length > 254) { errors[key] = 'Enter a valid email address'; break; }
        }
        if (rule.min && v.length < rule.min) { errors[key] = `${rule.label || key} must be at least ${rule.min} characters`; break; }
        if (rule.max && v.length > rule.max) { errors[key] = `${rule.label || key} must be at most ${rule.max} characters`; break; }
        if (rule.pattern && !rule.pattern.test(v)) { errors[key] = rule.patternMessage || `${rule.label || key} is invalid`; break; }
        out[key] = v;
        break;
      }
      case 'number': {
        const n = Number(v);
        if (!Number.isFinite(n)) { errors[key] = `${rule.label || key} must be a number`; break; }
        if (rule.min !== undefined && n < rule.min) { errors[key] = `${rule.label || key} must be at least ${rule.min}`; break; }
        if (rule.max !== undefined && n > rule.max) { errors[key] = `${rule.label || key} must be at most ${rule.max}`; break; }
        out[key] = n;
        break;
      }
      case 'boolean': {
        if (typeof v === 'boolean') out[key] = v;
        else if (v === 'true' || v === 'false') out[key] = v === 'true';
        else errors[key] = `${rule.label || key} must be true or false`;
        break;
      }
      case 'enum': {
        if (!rule.values.includes(v)) { errors[key] = `${rule.label || key} must be one of: ${rule.values.join(', ')}`; break; }
        out[key] = v;
        break;
      }
      case 'ids': {
        if (!Array.isArray(v) || !v.every(isValidId)) { errors[key] = `${rule.label || key} must be a list of valid ids`; break; }
        if (rule.max && v.length > rule.max) { errors[key] = `${rule.label || key} can contain at most ${rule.max} items`; break; }
        out[key] = [...new Set(v)];
        break;
      }
      default:
        out[key] = v;
    }
  }

  if (Object.keys(errors).length) throw ApiError.badRequest('Please fix the highlighted fields', errors);
  return out;
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { validateBody, isValidId, assertId, escapeRegex, EMAIL_RE };
