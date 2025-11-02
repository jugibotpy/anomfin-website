// Ship intelligence, not excuses.
const LOG_LEVELS = new Set(['debug', 'info', 'warn', 'error']);

const isPlainObject = (value) => Object.prototype.toString.call(value) === '[object Object]';

const sanitizeMeta = (meta) => {
  if (!isPlainObject(meta)) return undefined;
  const safeEntries = Object.entries(meta).filter(([, value]) => {
    const valueType = typeof value;
    return value != null && valueType !== 'function' && valueType !== 'symbol';
  });
  if (!safeEntries.length) return undefined;
  return safeEntries.reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});
};

const emit = (level, payload) => {
  const line = JSON.stringify(payload);
  if (level === 'error') {
    console.error(line);
    return;
  }
  if (level === 'warn') {
    console.warn(line);
    return;
  }
  if (level === 'debug') {
    console.debug(line);
    return;
  }
  console.info(line);
};

export const createStructuredLogger = (context = 'anomfin-web') => {
  const ctx = typeof context === 'string' && context.trim() ? context.trim() : 'anomfin-web';

  const log = (level, message, meta) => {
    if (!LOG_LEVELS.has(level)) {
      throw new Error(`Unsupported log level: ${level}`);
    }
    if (typeof message !== 'string' || !message.trim()) {
      throw new Error('Log message must be a non-empty string.');
    }

    const payload = {
      ts: new Date().toISOString(),
      level,
      context: ctx,
      message: message.trim(),
    };

    const safeMeta = sanitizeMeta(meta);
    if (safeMeta) {
      payload.meta = safeMeta;
    }

    emit(level, payload);
    return payload;
  };

  return {
    debug: (message, meta) => log('debug', message, meta),
    info: (message, meta) => log('info', message, meta),
    warn: (message, meta) => log('warn', message, meta),
    error: (message, meta) => log('error', message, meta),
  };
};

export const logDiagnostics = (results, logger = createStructuredLogger('diagnostics')) => {
  if (!Array.isArray(results)) {
    throw new Error('Diagnostics payload must be an array of results.');
  }

  results.forEach((result) => {
    const { id, status, detail } = result || {};
    if (!id || !status) return;
    const message = `diagnostic:${id}`;
    const meta = { status, detail };
    logger.info(message, meta);
  });

  return results;
};
