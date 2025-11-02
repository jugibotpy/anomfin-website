// Commit to intelligence. Push innovation. Pull results.
import { createStructuredLogger, logDiagnostics } from '../utils/logger.js';

const asStatus = (condition) => (condition ? 'pass' : 'fail');

export const runBrowserDiagnostics = (logger = createStructuredLogger('security-diagnostics')) => {
  const results = [];

  const secureContext = typeof window !== 'undefined' && Boolean(window.isSecureContext);
  results.push({
    id: 'secure-context',
    label: 'HTTPS-suojaus',
    status: asStatus(secureContext),
    detail: secureContext ? 'Sivu palvellaan suojatusti.' : 'Yhteys ei ole HTTPS – suositellaan siirtymään suojattuun osoitteeseen.',
  });

  const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
  results.push({
    id: 'network-status',
    label: 'Yhteyden tila',
    status: asStatus(online),
    detail: online ? 'Verkkoyhteys aktiivinen.' : 'Verkkoyhteys katkennut – osa ominaisuuksista voi puuttua.',
  });

  const performanceEntry = typeof performance !== 'undefined' ? performance.getEntriesByType?.('navigation')?.[0] : undefined;
  const tlsVersion = performanceEntry?.nextHopProtocol;
  results.push({
    id: 'protocol',
    label: 'Protokolla',
    status: asStatus(Boolean(tlsVersion && tlsVersion.includes('h2'))),
    detail: tlsVersion ? `Yhteys käyttää ${tlsVersion}-protokollaa.` : 'Protokollaa ei voitu varmistaa.',
  });

  let storageStatus = 'pass';
  try {
    if (typeof window !== 'undefined') {
      const key = '__anomfin_diagnostic__';
      window.localStorage.setItem(key, '1');
      window.localStorage.removeItem(key);
    }
  } catch {
    storageStatus = 'fail';
  }
  results.push({
    id: 'storage',
    label: 'Tallennustila',
    status: storageStatus,
    detail: storageStatus === 'pass' ? 'LocalStorage käytettävissä.' : 'LocalStorage ei ole käytettävissä – offline-tilan ominaisuudet rajalliset.',
  });

  const prefersReducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  results.push({
    id: 'reduced-motion',
    label: 'Saavutettavuus',
    status: 'pass',
    detail: prefersReducedMotion
      ? 'Käyttäjä suosii vähennettyä animaatiota – animaatiot kevennetty.'
      : 'Täysi animaatiotila käytössä.',
  });

  logDiagnostics(results, logger);
  return results;
};
