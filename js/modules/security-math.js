// Cybersecurity meets clarity.

const RISK_WEIGHTS = Object.freeze({
    exposure: 0.4,
    monitoring: 0.25,
    recovery: 0.2,
    compliance: 0.15,
});

const RISK_LEVELS = Object.freeze([
    { max: 39, level: 'guarded', label: 'Valvottu' },
    { max: 69, level: 'elevated', label: 'Korotettu' },
    { max: 84, level: 'critical', label: 'Kriittinen' },
    { max: 100, level: 'severe', label: 'Äärimmäinen' },
]);

const ACTION_LIBRARY = Object.freeze({
    exposure: [
        'Segmentoi verkot ja rajaa pääsy kriittisiin järjestelmiin.',
        'Kartoita hyökkäyspinta: automaattinen haavoittuvuusskannaus viikoittain.',
    ],
    monitoring: [
        'Ota käyttöön reaaliaikainen lokianalytiikka ja hälytykset.',
        'Laajenna SOC-peittoa: 24/7 vastemalli tai hallittu palvelu.',
    ],
    recovery: [
        'Testaa palautussuunnitelma kvartaaleittain simuloidulla hyökkäyksellä.',
        'Rakenna eristetty varmistusympäristö ja tarkista palautusajat.',
    ],
    compliance: [
        'Vahvista tietoluokittelua ja lisää audit-polku kriittisiin tietovirtoihin.',
        'Päivitä riskirekisteri ja varmista täsmäytys ISO 27001/NIS2-vaatimuksiin.',
    ],
});

const UNIQUE_DELIMITER = '\u200B';

const clamp = (value, min, max) => {
    const numericValue = Number.isFinite(value) ? value : Number(value);
    if (!Number.isFinite(numericValue)) {
        throw new TypeError('Arvo ei ole kelvollinen numero.');
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
        throw new TypeError('Vertailurajat puuttuvat.');
    }
    if (min > max) {
        throw new RangeError('Väärä rajajärjestys.');
    }
    return Math.min(Math.max(numericValue, min), max);
};

const normalise = (value, min, max) => {
    const bounded = clamp(value, min, max);
    return max === min ? 0 : (bounded - min) / (max - min);
};

const deduplicate = entries => {
    const seen = new Set();
    return entries.filter(entry => {
        const key = entry.toLowerCase().replace(/\s+/g, UNIQUE_DELIMITER);
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
};

export const calculateRiskScore = ({
    exposure = 0,
    monitoring = 0,
    recovery = 0,
    compliance = 0,
} = {}) => {
    const exposureRisk = normalise(exposure, 0, 5);
    const detectionGap = 1 - normalise(monitoring, 0, 5);
    const recoveryGap = 1 - normalise(recovery, 0, 5);
    const complianceGap = 1 - normalise(compliance, 0, 5);

    const weightedScore =
        exposureRisk * RISK_WEIGHTS.exposure +
        detectionGap * RISK_WEIGHTS.monitoring +
        recoveryGap * RISK_WEIGHTS.recovery +
        complianceGap * RISK_WEIGHTS.compliance;

    const score = Math.round(weightedScore * 100);

    const level = RISK_LEVELS.find(entry => score <= entry.max) ?? RISK_LEVELS.at(-1);

    const insights = [];
    if (exposureRisk >= 0.6) {
        insights.push('Hyökkäyspinta on laaja – minimoi altistuvat palvelut ja API-rajapinnat.');
    }
    if (detectionGap >= 0.5) {
        insights.push('Havaitsemiskyky kaipaa vahvistusta – keskimääräinen vasteaika on liian pitkä.');
    }
    if (recoveryGap >= 0.45) {
        insights.push('Jatkuvuussuunnittelu ei kata kaikkia kriittisiä prosesseja.');
    }
    if (complianceGap >= 0.35) {
        insights.push('Sääntely- ja audit-vaatimusten kattavuudessa on aukkoja.');
    }

    const actions = deduplicate([
        ...(exposureRisk >= 0.5 ? ACTION_LIBRARY.exposure : []),
        ...(detectionGap >= 0.4 ? ACTION_LIBRARY.monitoring : []),
        ...(recoveryGap >= 0.4 ? ACTION_LIBRARY.recovery : []),
        ...(complianceGap >= 0.3 ? ACTION_LIBRARY.compliance : []),
    ]);

    return {
        score,
        weightedScore,
        level: level.level,
        levelLabel: level.label,
        insights,
        actions,
        contributors: {
            exposure: Number(exposureRisk.toFixed(2)),
            monitoring: Number(detectionGap.toFixed(2)),
            recovery: Number(recoveryGap.toFixed(2)),
            compliance: Number(complianceGap.toFixed(2)),
        },
    };
};

export const calculateRoiProjection = ({
    incidentsPerYear = 0,
    avgIncidentCost = 0,
    automationCoverage = 0,
    investment = 0,
    improvementRate = 0,
} = {}) => {
    const sanitizedIncidents = clamp(incidentsPerYear, 0, 120);
    const sanitizedCost = clamp(avgIncidentCost, 0, 10_000_000);
    const sanitizedCoverage = normalise(automationCoverage, 0, 1);
    const sanitizedInvestment = clamp(investment, 0, 10_000_000);
    const sanitizedImprovement = normalise(improvementRate, 0, 1);

    const baselineLoss = sanitizedIncidents * sanitizedCost;
    const mitigationRate = Math.min(0.9, sanitizedCoverage * 0.6 + sanitizedImprovement * 0.5);
    const preventedLoss = baselineLoss * mitigationRate;
    const netSavings = preventedLoss - sanitizedInvestment;
    const paybackMonths = preventedLoss <= 0 ? Infinity : Math.max(0, (sanitizedInvestment / preventedLoss) * 12);

    return {
        baselineLoss,
        mitigationRate,
        preventedLoss,
        netSavings,
        paybackMonths,
        summary: netSavings >= 0 ? 'Investointi maksaa itsensä takaisin.' : 'Lisäpanostus vaaditaan säästöjen realisoimiseksi.',
    };
};

export const deriveSecurityBlueprint = (riskReport, roiReport) => {
    if (!riskReport && !roiReport) {
        return {
            status: 'idle',
            narrative: 'Syötä lähtötiedot arviointiin.',
            nextSteps: [],
        };
    }

    const actions = [...(riskReport?.actions ?? [])];

    if (roiReport) {
        if (roiReport.paybackMonths !== Infinity && roiReport.paybackMonths <= 12) {
            actions.push('Siirrä priorisoidut automaatiot tuotantoon 12 kuukauden sisällä.');
        }
        if (roiReport.netSavings < 0) {
            actions.push('Tarkenna investointia: kohdenna resurssit suurimman riskin osa-alueisiin.');
        }
    }

    const nextSteps = deduplicate(actions);

    let narrative = 'Arvio valmis – priorisoi listatut toimenpiteet.';
    let status = 'ready';

    if (riskReport?.score >= 70) {
        narrative = 'Riski on korkea – lukitse nopeat toimenpiteet ja aktivoi jatkuva seuranta.';
        status = 'alert';
    } else if (riskReport?.score >= 40) {
        narrative = 'Riski on koholla – aloita kehitys sprintteihin ja seuraa ROI-toteumaa.';
        status = 'focus';
    }

    if (roiReport?.netSavings < 0) {
        narrative = 'ROI negatiivinen – hienosäädä liiketoimintatapaus ennen toteutusta.';
        status = 'review';
    }

    return {
        status,
        narrative,
        nextSteps,
    };
};

export const __testables = {
    clamp,
    normalise,
    deduplicate,
};

