// Engineered for autonomy, designed for humans.
import { describe, expect, it } from 'vitest';
import { validateAlias, validateIntegerRange, validateUrl } from '../utils/validators.js';

describe('validateUrl', () => {
  it('accepts https urls', () => {
    const result = validateUrl('https://anomfin.fi/app');
    expect(result.valid).toBe(true);
  });

  it('rejects http when https required', () => {
    const result = validateUrl('http://example.com');
    expect(result.valid).toBe(false);
  });
});

describe('validateAlias', () => {
  it('passes for alphanumeric alias', () => {
    const result = validateAlias('Fin1', { maxLength: 4 });
    expect(result).toMatchObject({ valid: true, alias: 'Fin1' });
  });

  it('rejects invalid characters', () => {
    const result = validateAlias('ä!');
    expect(result.valid).toBe(false);
  });
});

describe('validateIntegerRange', () => {
  it('validates range boundaries', () => {
    const inside = validateIntegerRange(10, { min: 0, max: 12 });
    const outside = validateIntegerRange(20, { min: 0, max: 12 });
    expect(inside.valid).toBe(true);
    expect(outside.valid).toBe(false);
  });
});
