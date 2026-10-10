const { validateBody, isValidId, escapeRegex } = require('../src/utils/validate');

function errorsOf(fn) {
  try {
    fn();
  } catch (err) {
    return { status: err.status, errors: err.details };
  }
  return null;
}

describe('Input validation', () => {
  const rules = {
    name: { type: 'string', required: true, min: 2, max: 10 },
    email: { type: 'email', required: true },
    age: { type: 'number', min: 13, max: 120 },
    size: { type: 'enum', values: ['S', 'M'] },
    ok: { type: 'boolean' },
    bio: { type: 'string', max: 5 },
  };

  test('trims strings, lowercases emails and drops unknown fields (no mass assignment)', () => {
    const out = validateBody({ name: '  Riya ', email: 'RIYA@Example.COM', age: '21', size: 'M', ok: 'true', role: 'admin', owner: 'x' }, rules);
    expect(out).toEqual({ name: 'Riya', email: 'riya@example.com', age: 21, size: 'M', ok: true });
  });

  test('reports every invalid field with a 400', () => {
    const res = errorsOf(() => validateBody({ name: 'R', email: 'nope', age: 5, size: 'XL', ok: 'yes', bio: 'too long' }, rules));
    expect(res.status).toBe(400);
    for (const k of ['name', 'email', 'age', 'size', 'ok', 'bio']) expect(res.errors).toHaveProperty(k);
  });

  test('required fields are enforced; partial updates may omit them but not blank them', () => {
    expect(errorsOf(() => validateBody({}, rules)).errors).toHaveProperty('email');
    expect(validateBody({ bio: 'hey' }, rules, { partial: true })).toEqual({ bio: 'hey' });
    expect(errorsOf(() => validateBody({ name: '  ' }, rules, { partial: true })).errors).toHaveProperty('name');
    expect(validateBody({ bio: '' }, rules, { partial: true })).toEqual({ bio: '' });
  });

  test('rejects non-string values for text fields', () => {
    expect(errorsOf(() => validateBody({ name: { $gt: '' }, email: 'a@b.co' }, rules)).errors).toHaveProperty('name');
  });

  test('ObjectId validation and regex escaping', () => {
    expect(isValidId('64b7f0f0f0f0f0f0f0f0f0f0')).toBe(true);
    expect(isValidId('not-an-id')).toBe(false);
    expect(isValidId({ $ne: null })).toBe(false);
    expect(escapeRegex('a.*(b')).toBe('a\\.\\*\\(b');
  });
});
