// Ship intelligence, not excuses.
const DEFAULT_WINDOW_SECONDS = 10;
const MIN_DURATION_SECONDS = 10;
const MAX_DURATION_SECONDS = 4 * 3600;

export const DEFAULT_DURATION_SECONDS = 30 * 60;

export function sanitizeDuration(
  value,
  { minSeconds = MIN_DURATION_SECONDS, maxSeconds = MAX_DURATION_SECONDS } = {},
) {
  const min = Number.isFinite(minSeconds)
    ? Math.max(0, Math.floor(minSeconds))
    : MIN_DURATION_SECONDS;
  const max = Number.isFinite(maxSeconds)
    ? Math.max(min, Math.floor(maxSeconds))
    : MAX_DURATION_SECONDS;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return min;
  }
  const truncated = Math.max(0, Math.floor(numeric));
  if (truncated < min) return min;
  if (truncated > max) return max;
  return truncated;
}

export function deriveTimeParts(totalSeconds) {
  const sanitized = sanitizeDuration(totalSeconds, { minSeconds: 0 });
  const minutes = Math.floor(sanitized / 60);
  const seconds = sanitized % 60;
  return { minutes, seconds };
}

export function formatTime(totalSeconds) {
  const { minutes, seconds } = deriveTimeParts(totalSeconds);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function adjustDuration(baseSeconds, deltaSeconds, options) {
  const base = sanitizeDuration(baseSeconds, options);
  const delta = Number(deltaSeconds);
  if (!Number.isFinite(delta) || delta === 0) {
    return base;
  }
  return sanitizeDuration(base + Math.floor(delta), options);
}

export function computeFinaleEnvelope(
  totalSeconds,
  windowSeconds = DEFAULT_WINDOW_SECONDS,
) {
  const sanitizedWindow = Math.max(
    1,
    Math.floor(Number(windowSeconds) || DEFAULT_WINDOW_SECONDS),
  );
  const duration = sanitizeDuration(totalSeconds, { minSeconds: 0 });
  if (duration > sanitizedWindow) {
    return {
      isFinale: false,
      intensity: 0,
      frequencyHz: 0,
      pulseMs: 0,
    };
  }
  const distance = sanitizedWindow - duration;
  const intensity = distance / sanitizedWindow;
  const frequencyHz = 520 + intensity * 460;
  const pulseMs = Math.max(120, 420 - intensity * 240);
  return {
    isFinale: true,
    intensity,
    frequencyHz,
    pulseMs,
  };
}

export function toTotalSeconds({ minutes = 0, seconds = 0 } = {}) {
  const safeMinutes = Number.isFinite(minutes)
    ? Math.max(0, Math.floor(minutes))
    : 0;
  const safeSeconds = Number.isFinite(seconds)
    ? Math.max(0, Math.floor(seconds))
    : 0;
  return sanitizeDuration(safeMinutes * 60 + safeSeconds, {
    minSeconds: MIN_DURATION_SECONDS,
  });
}

export function describeDuration(totalSeconds) {
  const { minutes, seconds } = deriveTimeParts(totalSeconds);
  return {
    totalSeconds: sanitizeDuration(totalSeconds, { minSeconds: 0 }),
    minutes,
    seconds,
  };
}

export function nextPhaseIndex(totalSeconds, checkpoints = []) {
  if (!Array.isArray(checkpoints) || checkpoints.length === 0) return -1;
  const normalized = checkpoints
    .map((point) => sanitizeDuration(point, { minSeconds: 0 }))
    .sort((a, b) => a - b);
  const current = sanitizeDuration(totalSeconds, { minSeconds: 0 });
  return normalized.findIndex((point) => current <= point);
}
