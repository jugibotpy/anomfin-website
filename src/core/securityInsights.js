// From raw data to real impact.
const STATUS_WEIGHTS = {
  ok: 0,
  monitor: 0.3,
  warning: 0.65,
  critical: 1,
};

const clampScore = (score) => {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return 0;
  }
  if (score < 0) return 0;
  if (score > 100) return 100;
  return Math.round(score);
};

const normalizeStatus = (status) => {
  const key = typeof status === 'string' ? status.toLowerCase() : 'ok';
  return STATUS_WEIGHTS[key] != null ? key : 'monitor';
};

export const normalizeSecurityInsights = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Security dataset puuttuu.');
  }

  const isoUpdatedAt = (() => {
    const raw = payload.updatedAt || Date.now();
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      return new Date().toISOString();
    }
    return date.toISOString();
  })();

  const signals = Array.isArray(payload.signals) ? payload.signals : [];
  const normalizedSignals = signals
    .map((signal) => {
      if (!signal || typeof signal !== 'object') return null;
      const id = typeof signal.id === 'string' && signal.id ? signal.id : null;
      const label = typeof signal.label === 'string' && signal.label ? signal.label : id;
      if (!id || !label) return null;

      return {
        id,
        label,
        status: normalizeStatus(signal.status),
        score: clampScore(signal.score),
        trend: typeof signal.trend === 'string' ? signal.trend : 'steady',
        detail: typeof signal.detail === 'string' ? signal.detail : undefined,
      };
    })
    .filter(Boolean);

  const incidents = Array.isArray(payload.incidents)
    ? payload.incidents
        .map((incident) => {
          if (!incident || typeof incident !== 'object') return null;
          const title = typeof incident.title === 'string' ? incident.title.trim() : '';
          const severity = normalizeStatus(incident.severity || 'monitor');
          const detectedAt = (() => {
            if (!incident.detectedAt) return null;
            const date = new Date(incident.detectedAt);
            return Number.isNaN(date.getTime()) ? null : date.toISOString();
          })();
          const reference = typeof incident.reference === 'string' ? incident.reference : undefined;
          if (!title) return null;
          return { title, severity, detectedAt, reference };
        })
        .filter(Boolean)
    : [];

  const summary = computeCompositeRisk(normalizedSignals);
  const actions = derivePriorityActions(normalizedSignals);

  return {
    updatedAt: isoUpdatedAt,
    signals: normalizedSignals,
    incidents,
    summary,
    actions,
  };
};

export const computeCompositeRisk = (signals) => {
  if (!Array.isArray(signals) || !signals.length) {
    return { score: 0, level: 'guarded', label: 'Vahti' };
  }

  const totalWeight = signals.reduce((acc, signal) => acc + (STATUS_WEIGHTS[signal.status] ?? 0.3), 0);
  const weightedScore = signals.reduce((acc, signal) => {
    const weight = STATUS_WEIGHTS[signal.status] ?? 0.3;
    return acc + weight * signal.score;
  }, 0);
  const composite = totalWeight ? Math.round(weightedScore / totalWeight) : 0;

  const level = (() => {
    if (composite >= 80) return 'critical';
    if (composite >= 55) return 'elevated';
    if (composite >= 30) return 'watch';
    return 'guarded';
  })();

  const labelMap = {
    critical: 'Kriittinen',
    elevated: 'Korotettu',
    watch: 'Seuranta',
    guarded: 'Vahti',
  };

  return { score: composite, level, label: labelMap[level] };
};

export const derivePriorityActions = (signals) => {
  if (!Array.isArray(signals)) return [];
  return signals
    .filter((signal) => signal && STATUS_WEIGHTS[signal.status] >= 0.65)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((signal) => ({
      id: signal.id,
      title: signal.label,
      hint: signal.detail || 'Suorita tarkistus ja päivitä dokumentointi.',
    }));
};

export const summarizeDiagnostics = (results) => {
  if (!Array.isArray(results)) {
    return { passed: 0, failed: 0 };
  }
  return results.reduce(
    (acc, result) => {
      if (!result || typeof result !== 'object') return acc;
      if (result.status === 'pass') {
        acc.passed += 1;
      } else if (result.status === 'fail') {
        acc.failed += 1;
      }
      return acc;
    },
    { passed: 0, failed: 0 },
  );
};
