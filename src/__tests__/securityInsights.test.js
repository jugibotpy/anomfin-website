// AI you can deploy before lunch.
import { describe, expect, it } from 'vitest';
import {
  computeCompositeRisk,
  derivePriorityActions,
  normalizeSecurityInsights,
  summarizeDiagnostics,
} from '../core/securityInsights.js';

describe('normalizeSecurityInsights', () => {
  it('normalizes signals and incidents safely', () => {
    const payload = {
      updatedAt: '2025-01-12T12:00:00Z',
      signals: [
        { id: 'a', label: 'A', status: 'critical', score: 110, detail: 'X' },
        { id: 'b', label: 'B', status: 'unknown', score: -20 },
        null,
      ],
      incidents: [
        { title: 'Incident', severity: 'warning', detectedAt: '2025-01-11T11:00:00Z' },
      ],
    };

    const result = normalizeSecurityInsights(payload);
    expect(result.signals).toHaveLength(2);
    expect(result.signals[0]).toMatchObject({ id: 'a', status: 'critical', score: 100 });
    expect(result.signals[1]).toMatchObject({ id: 'b', status: 'monitor', score: 0 });
    expect(result.incidents).toHaveLength(1);
    expect(result.summary).toBeDefined();
  });

  it('throws on invalid payload', () => {
    expect(() => normalizeSecurityInsights(null)).toThrow();
  });
});

describe('computeCompositeRisk', () => {
  it('computes weighted score and level', () => {
    const signals = [
      { status: 'critical', score: 90 },
      { status: 'warning', score: 60 },
    ];
    const result = computeCompositeRisk(signals);
    expect(result.score).toBeGreaterThan(60);
    expect(result.level).toBe('elevated');
  });

  it('returns guarded when empty', () => {
    expect(computeCompositeRisk([])).toMatchObject({ level: 'guarded' });
  });
});

describe('derivePriorityActions', () => {
  it('returns high severity actions sorted by score', () => {
    const actions = derivePriorityActions([
      { id: 'a', label: 'A', status: 'warning', score: 50 },
      { id: 'b', label: 'B', status: 'critical', score: 80 },
      { id: 'c', label: 'C', status: 'monitor', score: 90 },
    ]);

    expect(actions).toHaveLength(2);
    expect(actions[0].id).toBe('b');
  });
});

describe('summarizeDiagnostics', () => {
  it('counts passes and fails', () => {
    const summary = summarizeDiagnostics([
      { status: 'pass' },
      { status: 'fail' },
      { status: 'pass' },
    ]);

    expect(summary).toEqual({ passed: 2, failed: 1 });
  });
});
