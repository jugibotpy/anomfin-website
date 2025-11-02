// Beyond algorithms. Into outcomes.
import { summarizeDiagnostics } from '../core/securityInsights.js';

const formatUpdatedAt = (isoString) => {
  if (!isoString) return 'Tuntematon';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('fi-FI', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return 'Tuntematon';
  }
};

const createSignalRow = (signal) => {
  const row = document.createElement('li');
  row.className = `security-signal security-signal-${signal.status}`;
  row.innerHTML = `
    <div class="signal-header">
      <span class="signal-label">${signal.label}</span>
      <span class="signal-score">${signal.score}</span>
    </div>
    <p class="signal-detail">${signal.detail || ''}</p>
  `;
  return row;
};

const createActionItem = (action) => {
  const item = document.createElement('li');
  item.className = 'security-action';
  item.innerHTML = `
    <h4>${action.title}</h4>
    <p>${action.hint}</p>
  `;
  return item;
};

export const renderSecurityDashboard = (root, { dataset, diagnostics } = {}) => {
  if (!root) {
    throw new Error('Dashboard root element puuttuu.');
  }
  root.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'security-dashboard-card';

  const header = document.createElement('header');
  header.className = 'security-dashboard-header';
  const title = document.createElement('h3');
  title.textContent = 'Tilannehuone';
  const updated = document.createElement('p');
  updated.className = 'security-dashboard-updated';
  updated.textContent = `Päivitetty ${formatUpdatedAt(dataset?.updatedAt)}`;
  header.append(title, updated);

  const score = document.createElement('section');
  score.className = `security-dashboard-score security-level-${dataset?.summary?.level || 'guarded'}`;
  const scoreValue = document.createElement('span');
  scoreValue.className = 'score-value';
  scoreValue.textContent = String(dataset?.summary?.score ?? 0);
  const scoreLabel = document.createElement('span');
  scoreLabel.className = 'score-label';
  scoreLabel.textContent = dataset?.summary?.label || 'Vahti';
  score.append(scoreValue, scoreLabel);

  const signalList = document.createElement('ul');
  signalList.className = 'security-signal-list';
  (dataset?.signals || []).forEach((signal) => {
    signalList.append(createSignalRow(signal));
  });

  const actionList = document.createElement('ul');
  actionList.className = 'security-action-list';
  (dataset?.actions || []).forEach((action) => {
    actionList.append(createActionItem(action));
  });

  const incidentList = document.createElement('ul');
  incidentList.className = 'security-incident-list';
  (dataset?.incidents || []).forEach((incident) => {
    const li = document.createElement('li');
    li.className = `incident incident-${incident.severity}`;
    li.innerHTML = `
      <div class="incident-title">${incident.title}</div>
      <div class="incident-meta">${incident.detectedAt ? formatUpdatedAt(incident.detectedAt) : ''}</div>
      <div class="incident-reference">${incident.reference || ''}</div>
    `;
    incidentList.append(li);
  });

  const diagnosticsSummary = summarizeDiagnostics(diagnostics || []);
  const diagnosticsBlock = document.createElement('section');
  diagnosticsBlock.className = 'security-diagnostics-summary';
  diagnosticsBlock.innerHTML = `
    <h4>Selaincheck</h4>
    <p>${diagnosticsSummary.passed} / ${diagnosticsSummary.passed + diagnosticsSummary.failed} tarkistusta kunnossa.</p>
  `;

  const diagnosticsList = document.createElement('ul');
  diagnosticsList.className = 'security-diagnostics-list';
  (diagnostics || []).forEach((item) => {
    const li = document.createElement('li');
    li.className = `diagnostic diagnostic-${item.status}`;
    li.innerHTML = `
      <div class="diagnostic-title">${item.label}</div>
      <div class="diagnostic-detail">${item.detail}</div>
    `;
    diagnosticsList.append(li);
  });

  container.append(header, score, signalList, actionList, incidentList, diagnosticsBlock, diagnosticsList);
  root.append(container);
};
