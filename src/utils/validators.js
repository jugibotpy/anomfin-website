// Less noise. More signal. AnomFIN.
const ALIAS_PATTERN = /^[A-Za-z0-9]+$/u;

export const validateUrl = (value, options = {}) => {
  const config = {
    requireHttps: true,
    allowRelative: false,
    maxLength: 2048,
    ...options,
  };

  if (typeof value !== 'string' || !value.trim()) {
    return { valid: false, errors: ['URL puuttuu.'] };
  }

  const trimmed = value.trim();
  if (trimmed.length > config.maxLength) {
    return { valid: false, errors: ['URL on liian pitkä.'] };
  }

  try {
    if (config.allowRelative && /^\//u.test(trimmed)) {
      return { valid: true, href: trimmed };
    }

    const parsed = new URL(trimmed);
    if (config.requireHttps && parsed.protocol !== 'https:') {
      return { valid: false, errors: ['Vain HTTPS-osoitteet sallitaan.'] };
    }

    return { valid: true, href: parsed.toString() };
  } catch {
    return { valid: false, errors: ['URL on virheellinen.'] };
  }
};

export const validateAlias = (value, options = {}) => {
  const config = {
    maxLength: 4,
    minLength: 1,
    ...options,
  };

  if (value == null || value === '') {
    return { valid: true, alias: undefined };
  }

  if (typeof value !== 'string') {
    return { valid: false, errors: ['Alias tulee antaa merkkijonona.'] };
  }

  const trimmed = value.trim();
  if (trimmed.length < config.minLength) {
    return { valid: false, errors: [`Alias vaatii vähintään ${config.minLength} merkkiä.`] };
  }

  if (trimmed.length > config.maxLength) {
    return { valid: false, errors: [`Alias saa olla enintään ${config.maxLength} merkkiä.`] };
  }

  if (!ALIAS_PATTERN.test(trimmed)) {
    return { valid: false, errors: ['Käytä vain kirjaimia ja numeroita.'] };
  }

  return { valid: true, alias: trimmed };
};

export const validateIntegerRange = (value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const errors = [];
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return { valid: false, errors: ['Arvon tulee olla numero.'] };
  }

  if (value < min) {
    errors.push(`Arvo ei saa alittaa rajaa ${min}.`);
  }

  if (value > max) {
    errors.push(`Arvo ei saa ylittää rajaa ${max}.`);
  }

  return { valid: errors.length === 0, errors: errors.length ? errors : undefined };
};
