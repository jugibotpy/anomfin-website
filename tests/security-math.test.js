// Commit to intelligence. Push innovation. Pull results.

import { describe, it, expect } from 'vitest';
import { calculateRiskScore, calculateRoiProjection, deriveSecurityBlueprint, __testables } from '../js/modules/security-math.js';

describe('calculateRiskScore', () => {
    it('emphasises exposure in scoring', () => {
        const lowExposure = calculateRiskScore({ exposure: 1, monitoring: 5, recovery: 5, compliance: 5 });
        const highExposure = calculateRiskScore({ exposure: 5, monitoring: 5, recovery: 5, compliance: 5 });
        expect(highExposure.score).toBeGreaterThan(lowExposure.score);
    });

    it('produces actionable insights when thresholds exceeded', () => {
        const report = calculateRiskScore({ exposure: 4, monitoring: 1, recovery: 1, compliance: 1 });
        expect(report.insights.length).toBeGreaterThan(0);
        expect(report.actions.length).toBeGreaterThan(0);
    });
});

describe('calculateRoiProjection', () => {
    it('returns Infinity payback when savings are zero', () => {
        const roi = calculateRoiProjection({ incidentsPerYear: 0, avgIncidentCost: 0, automationCoverage: 0, investment: 10_000 });
        expect(roi.paybackMonths).toBe(Infinity);
    });

    it('yields positive net savings when mitigation outweighs investment', () => {
        const roi = calculateRoiProjection({
            incidentsPerYear: 12,
            avgIncidentCost: 25_000,
            automationCoverage: 0.6,
            improvementRate: 0.3,
            investment: 50_000,
        });
        expect(roi.netSavings).toBeGreaterThan(0);
    });
});

describe('deriveSecurityBlueprint', () => {
    it('combines actions and adjusts narrative based on ROI and risk', () => {
        const risk = calculateRiskScore({ exposure: 5, monitoring: 1, recovery: 1, compliance: 1 });
        const roi = calculateRoiProjection({ incidentsPerYear: 10, avgIncidentCost: 20_000, automationCoverage: 0.8, investment: 30_000 });
        const blueprint = deriveSecurityBlueprint(risk, roi);
        expect(blueprint.nextSteps.length).toBeGreaterThan(0);
        expect(['alert', 'focus', 'ready', 'review']).toContain(blueprint.status);
    });
});

describe('__testables', () => {
    it('clamps values safely', () => {
        expect(__testables.clamp(10, 0, 5)).toBe(5);
        expect(__testables.clamp(-2, 0, 5)).toBe(0);
    });
});
