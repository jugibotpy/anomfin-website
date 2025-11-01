// Trust by design, proof by delivery.

import { calculateRiskScore, calculateRoiProjection, deriveSecurityBlueprint } from './modules/security-math.js';

const STORAGE_KEY = 'anomfin:security-suite:v1';
const TELEMETRY_CHANNEL = 'anomfin-security-suite';

const logEvent = (event, detail = {}) => {
    try {
        const payload = {
            event,
            detail,
            timestamp: new Date().toISOString(),
        };
        console.info(TELEMETRY_CHANNEL, JSON.stringify(payload));
    } catch (error) {
        console.warn(TELEMETRY_CHANNEL, 'log-failed', error);
    }
};

const safeNumber = (value, fallback = 0) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : fallback;
};

const readRangeValue = input => Number.parseInt(input.value, 10) || 0;

const readNumberValue = (input, { min = 0, max = Number.POSITIVE_INFINITY } = {}) => {
    const value = safeNumber(input.value, min);
    return Math.min(Math.max(value, min), max);
};

const select = selector => document.querySelector(selector);

const getState = () => {
    try {
        const cached = localStorage.getItem(STORAGE_KEY);
        return cached ? JSON.parse(cached) : {};
    } catch (error) {
        logEvent('state:read-failed', { message: error.message });
        return {};
    }
};

const setState = nextState => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch (error) {
        logEvent('state:write-failed', { message: error.message });
    }
};

const formatCurrency = value =>
    new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Math.round(value));

const formatPercentage = value => `${Math.round(value * 100)} %`;

const applyBlueprint = blueprint => {
    const blueprintCard = select('#blueprint-card');
    if (!blueprintCard) {
        return;
    }

    const statusElement = select('#blueprint-status');
    const narrativeElement = select('#blueprint-narrative');
    const listElement = select('#blueprint-actions');

    if (statusElement) {
        statusElement.textContent = blueprint.status ?? 'idle';
        statusElement.dataset.status = blueprint.status ?? 'idle';
    }

    if (narrativeElement) {
        narrativeElement.textContent = blueprint.narrative ?? '';
    }

    if (listElement) {
        listElement.innerHTML = '';
        const steps = blueprint.nextSteps ?? [];
        if (!steps.length) {
            const item = document.createElement('li');
            item.textContent = 'Syötä tiedot saadaksesi priorisoidut toimet.';
            listElement.append(item);
        } else {
            steps.slice(0, 5).forEach(step => {
                const item = document.createElement('li');
                item.textContent = step;
                listElement.append(item);
            });
        }
    }

    blueprintCard.setAttribute('data-state', blueprint.status ?? 'idle');
};

const renderRisk = risk => {
    const scoreElement = select('#risk-score');
    const levelElement = select('#risk-level');
    const insightList = select('#risk-insights');
    const telemetryElement = select('#risk-telemetry');

    if (scoreElement) {
        scoreElement.textContent = risk ? String(risk.score) : '0';
    }
    if (levelElement) {
        levelElement.textContent = risk ? risk.levelLabel : 'Valvottu';
        levelElement.dataset.level = risk ? risk.level : 'guarded';
    }
    if (insightList) {
        insightList.innerHTML = '';
        const insights = risk?.insights ?? [];
        if (!insights.length) {
            const item = document.createElement('li');
            item.textContent = 'Syötä arvot liukusäätimillä nähdäksesi riskianalyysin.';
            insightList.append(item);
        } else {
            insights.forEach(text => {
                const item = document.createElement('li');
                item.textContent = text;
                insightList.append(item);
            });
        }
    }
    if (telemetryElement && risk) {
        telemetryElement.textContent = `${formatPercentage(risk.contributors.exposure)} hyökkäyspintaa · ${formatPercentage(
            risk.contributors.monitoring,
        )} valvontavajetta`;
    }
};

const renderRoi = roi => {
    const baselineElement = select('#roi-baseline');
    const savingsElement = select('#roi-savings');
    const paybackElement = select('#roi-payback');
    const summaryElement = select('#roi-summary');

    if (baselineElement) {
        baselineElement.textContent = roi ? formatCurrency(roi.baselineLoss) : formatCurrency(0);
    }
    if (savingsElement) {
        savingsElement.textContent = roi ? formatCurrency(roi.preventedLoss) : formatCurrency(0);
    }
    if (paybackElement) {
        const months = roi?.paybackMonths;
        paybackElement.textContent = !roi || months === Infinity ? 'Ei takaisinmaksua nykyisillä arvoilla' : `${Math.ceil(months)} kk`;
    }
    if (summaryElement) {
        summaryElement.textContent = roi ? roi.summary : 'Täytä tiedot ja näet takaisinmaksuajan.';
    }
};

const bindRangeOutputs = form => {
    form.querySelectorAll('input[type="range"]').forEach(input => {
        const output = form.querySelector(`output[for="${input.id}"]`);
        if (!output) {
            return;
        }
        const update = () => {
            output.textContent = `${input.value} / 5`;
        };
        input.addEventListener('input', update);
        update();
    });
};

const restoreFormValues = (form, values = {}) => {
    Object.entries(values).forEach(([key, value]) => {
        const field = form.elements.namedItem(key);
        if (field) {
            field.value = value;
        }
    });
};

const initSecuritySuite = () => {
    const storedState = getState();

    const riskForm = select('#risk-form');
    const roiForm = select('#roi-form');

    let riskInputs = storedState.riskInputs ?? {};
    let roiInputs = storedState.roiInputs ?? {};
    let currentState = { risk: null, roi: null };

    if (riskForm) {
        restoreFormValues(riskForm, riskInputs);
        bindRangeOutputs(riskForm);
        riskForm.addEventListener('input', () => {
            riskInputs = {
                exposure: readRangeValue(riskForm.elements.namedItem('exposure')),
                monitoring: readRangeValue(riskForm.elements.namedItem('monitoring')),
                recovery: readRangeValue(riskForm.elements.namedItem('recovery')),
                compliance: readRangeValue(riskForm.elements.namedItem('compliance')),
            };
            const risk = calculateRiskScore(riskInputs);
            renderRisk(risk);
            const blueprint = deriveSecurityBlueprint(risk, currentState.roi);
            applyBlueprint(blueprint);
            currentState = { ...currentState, risk };
            setState({ riskInputs, roiInputs });
            logEvent('risk:update', { score: risk.score, level: risk.level });
        });
    }

    if (roiForm) {
        restoreFormValues(roiForm, roiInputs);
        roiForm.addEventListener('input', () => {
            roiInputs = {
                incidentsPerYear: readNumberValue(roiForm.elements.namedItem('incidentsPerYear'), { max: 120 }),
                avgIncidentCost: readNumberValue(roiForm.elements.namedItem('avgIncidentCost'), { max: 10_000_000 }),
                automationCoverage: readNumberValue(roiForm.elements.namedItem('automationCoverage'), { max: 100 }) / 100,
                improvementRate: readNumberValue(roiForm.elements.namedItem('improvementRate'), { max: 100 }) / 100,
                investment: readNumberValue(roiForm.elements.namedItem('investment'), { max: 10_000_000 }),
            };
            const roi = calculateRoiProjection(roiInputs);
            renderRoi(roi);
            const blueprint = deriveSecurityBlueprint(currentState.risk, roi);
            applyBlueprint(blueprint);
            currentState = { ...currentState, roi };
            setState({ riskInputs, roiInputs });
            logEvent('roi:update', {
                preventedLoss: roi.preventedLoss,
                netSavings: roi.netSavings,
                paybackMonths: roi.paybackMonths,
            });
        });
    }

    currentState = {
        risk: riskForm
            ? calculateRiskScore({
                exposure: readRangeValue(riskForm.elements.namedItem('exposure')),
                monitoring: readRangeValue(riskForm.elements.namedItem('monitoring')),
                recovery: readRangeValue(riskForm.elements.namedItem('recovery')),
                compliance: readRangeValue(riskForm.elements.namedItem('compliance')),
            })
            : null,
        roi: roiForm
            ? calculateRoiProjection({
                  incidentsPerYear: readNumberValue(roiForm.elements.namedItem('incidentsPerYear'), { max: 120 }),
                  avgIncidentCost: readNumberValue(roiForm.elements.namedItem('avgIncidentCost'), { max: 10_000_000 }),
                  automationCoverage:
                      readNumberValue(roiForm.elements.namedItem('automationCoverage'), { max: 100 }) / 100,
                  improvementRate: readNumberValue(roiForm.elements.namedItem('improvementRate'), { max: 100 }) / 100,
                  investment: readNumberValue(roiForm.elements.namedItem('investment'), { max: 10_000_000 }),
              })
            : null,
    };

    renderRisk(currentState.risk);
    renderRoi(currentState.roi);
    applyBlueprint(deriveSecurityBlueprint(currentState.risk, currentState.roi));
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSecuritySuite, { once: true });
} else {
    initSecuritySuite();
}

