// Security-first. Creator-ready. Future-proof.
import { normalizeSecurityInsights } from '../core/securityInsights.js';
import { createStructuredLogger } from '../utils/logger.js';

const DEFAULT_SOURCE = 'data/security-insights.json';

const withTimeoutSignal = (timeoutMs, externalSignal) => {
  const controller = new AbortController();
  let timeoutId;

  if (typeof timeoutMs === 'number' && timeoutMs > 0) {
    timeoutId = setTimeout(() => controller.abort(new Error('Timeout exceeded')), timeoutMs);
  }

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
    } else {
      externalSignal.addEventListener(
        'abort',
        () => {
          controller.abort(externalSignal.reason);
        },
        { once: true },
      );
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      if (timeoutId) clearTimeout(timeoutId);
    },
    cancel: () => controller.abort(new Error('Cancelled')),
  };
};

export const fetchSecurityInsights = async (
  url = DEFAULT_SOURCE,
  { timeoutMs = 4000, signal, logger = createStructuredLogger('security-data') } = {},
) => {
  const { signal: combinedSignal, cleanup } = withTimeoutSignal(timeoutMs, signal);
  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
      signal: combinedSignal,
    });

    if (!response.ok) {
      const error = new Error(`Security feed returned ${response.status}`);
      logger.warn('security-feed-error', { status: response.status });
      throw error;
    }

    const data = await response.json();
    const normalized = normalizeSecurityInsights(data);
    logger.info('security-feed-loaded', { updatedAt: normalized.updatedAt, signals: normalized.signals.length });
    return normalized;
  } catch (error) {
    if (error?.name === 'AbortError') {
      logger.warn('security-feed-timeout', { url });
    } else {
      logger.error('security-feed-failed', { message: error?.message, url });
    }
    throw error;
  } finally {
    cleanup?.();
  }
};
