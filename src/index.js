// Cybersecurity meets clarity.
import { fetchSecurityInsights } from './services/securityData.js';
import { runBrowserDiagnostics } from './services/diagnostics.js';
import { renderSecurityDashboard } from './ui/securityDashboard.js';
import { createStructuredLogger } from './utils/logger.js';
import { validateAlias, validateUrl } from './utils/validators.js';

const logger = createStructuredLogger('anomfin-ui');
const state = {
  dataset: null,
  diagnostics: [],
};

const setDashboardStatus = (root, status, message) => {
  if (!root) return;
  root.dataset.state = status;
  if (message) {
    root.setAttribute('data-message', message);
  } else {
    root.removeAttribute('data-message');
  }
};

const displayDashboardError = (root, message) => {
  if (!root) return;
  root.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'security-dashboard-error';
  box.innerHTML = `
    <h3>Tilanne ei saatavilla</h3>
    <p>${message}</p>
  `;
  root.append(box);
};

const refreshDashboard = async (root) => {
  if (!root) return;
  setDashboardStatus(root, 'loading');
  try {
    const diagnostics = runBrowserDiagnostics();
    state.diagnostics = diagnostics;
    const dataset = await fetchSecurityInsights();
    state.dataset = dataset;
    renderSecurityDashboard(root, { dataset, diagnostics });
    setDashboardStatus(root, 'ready');
    logger.info('dashboard-rendered', { updatedAt: dataset.updatedAt });
  } catch (error) {
    logger.error('dashboard-failed', { message: error?.message });
    displayDashboardError(root, 'Tietoja ei saatu ladattua. Yritä uudelleen myöhemmin.');
    setDashboardStatus(root, 'error', error?.message || 'Tuntematon virhe');
  }
};

const attachDashboardControls = (root) => {
  const refreshButton = document.querySelector('[data-security-refresh]');
  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      refreshDashboard(root);
    });
  }
};

const attachShortenerValidation = () => {
  const form = document.getElementById('short-link-form');
  const urlInput = document.getElementById('shortener-target');
  const aliasInput = document.getElementById('shortener-alias');
  const hintEl = document.getElementById('shortener-hint');

  if (!form || !urlInput || !aliasInput || !hintEl) {
    return;
  }

  const shortenerSettings = window.__ANOMFIN_SETTINGS?.shortener || {};
  const maxLength = Number(shortenerSettings.maxLength) || 4;

  const updateHint = () => {
    const urlResult = validateUrl(urlInput.value, { requireHttps: shortenerSettings.enforceHttps !== false });
    if (!urlResult.valid) {
      hintEl.textContent = urlResult.errors?.[0] || 'Anna HTTPS-osoite.';
      hintEl.dataset.state = 'error';
      return;
    }

    const aliasResult = validateAlias(aliasInput.value, { maxLength });
    if (!aliasResult.valid) {
      hintEl.textContent = aliasResult.errors?.[0] || 'Alias tarkistettava.';
      hintEl.dataset.state = 'error';
      return;
    }

    hintEl.textContent = 'Hyvältä näyttää – voit luoda linkin turvallisesti.';
    hintEl.dataset.state = 'success';
  };

  form.addEventListener('input', updateHint);
  updateHint();
};

const init = () => {
  const dashboardRoot = document.querySelector('[data-security-dashboard]');
  if (dashboardRoot) {
    attachDashboardControls(dashboardRoot);
    refreshDashboard(dashboardRoot);
  }
  attachShortenerValidation();
};

document.addEventListener('DOMContentLoaded', init);
