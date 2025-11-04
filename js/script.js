// i18n Configuration - Finnish text messages
const MESSAGES = {
    contact: {
        requiredFields: 'Täytä yritys-, nimi- ja sähköpostikentät.',
        invalidEmail: 'Tarkista sähköpostiosoite.',
        consentRequired: 'Hyväksy tietosuoja, jotta voimme olla yhteydessä.',
        success: 'Kiitos viestistä – AnomFIN | AnomTools palaa pian asiaan.'
    },
    linkShortener: {
        success: 'Lyhyt linkki on valmis – HyperLaunch valmiina jakoon.',
        error: 'Lyhennys epäonnistui – tarkista yhteys tai ota yhteyttä AnomFIN-tiimiin.',
        copied: 'Kopioitu! Jaetaan turvallisesti.'
    }
};

// Mobile Navigation Toggle & Smooth Scroll Enhancements
let navbarRef = null;
let navLogoRef = null;

document.addEventListener('DOMContentLoaded', async () => {
    await applyGlobalSettings();
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');

    navbarRef = document.querySelector('.navbar');
    navLogoRef = document.querySelector('.nav-logo');

    initIntroOverlay();
    setupHeroFlash();
    initNavLogoHalo(navLogoRef);
    initLogoRectangleInteraction(); // Add matrix interaction
    initLeftEdgeBox(); // Add left-edge floating box
    initMobileVisualEnhancements(); // Add mobile visual enhancements
    initMobileHyperCubeTrigger(); // Add mobile hypercube trigger
    initMobileHypercube(); // Add GitHub hypercube effect
    initMobileParticles(); // Add particle effect


    if (mobileMenu && navMenu) {
        mobileMenu.addEventListener('click', () => {
            const expanded = mobileMenu.getAttribute('aria-expanded') === 'true';
            mobileMenu.setAttribute('aria-expanded', String(!expanded));
            mobileMenu.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                navMenu.classList.remove('active');
                mobileMenu.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Scroll reveal setup
    initScrollReveal();

    // Contact form handling
    initContactForm();
    initLinkShortener();

    const hybercubeEnabled = (document.body?.dataset?.hybercube ?? '1') !== '0';
    const chatDockEnabled = (document.body?.dataset?.chatDock ?? '1') !== '0';

    if (hybercubeEnabled) {
        initScrollCompanion();
    }

    if (chatDockEnabled) {
        initChatWidget();
    }

    // Applications section
    initApplicationsSection();
    initPlatformShowcase();

    updateNavbarChrome();
});

const ANOMFIN_DEFAULT_SETTINGS = {
    cssVars: {
        '--intro-blackout-ms': '1500ms',
        '--intro-bg-fade-ms': '3100ms',
        '--logo-reveal-ms': '3100ms',
        '--logo-initial-opacity': '0.2',
        '--logo-initial-blur': '80px',
        '--logo-initial-brightness': '0.85',
        '--logo-initial-scale': '2',
        '--logo-move-duration-ms': '2050ms',
        '--logo-move-delay-ms': '1500ms',
        '--logo-arc-x': '0.65',
        '--logo-arc-dy': '60px',
        '--grid-hue-duration-ms': '2500ms',
        '--square-shake-duration-ms': '1500ms',
        '--square-shake-amp': '14px',
        '--square-scale-end': '1.25',
        '--hero-arrival-duration-ms': '1400ms',
        '--orb-float-duration-s': '8s',
        '--grid-float-duration-s': '6s',
        '--eyebrow-size': '1rem',
        '--services-fade-delay-ms': '1000ms',
        '--neon': '#00FFA6',
        '--square-green-rgba': '0,255,150',
        '--logo-ease': 'cubic-bezier(.2,.8,.2,1)',
    },
    behaviors: {
        reactHover: true,
        reactContact: true,
        heroMask: true,
        floatingGrid: false,
        pageVibration: 0,
        hybercube: true,
        chatDock: true,
    },
    preset: null,
    meta: {},
    branding: {
        navEmblemUrl: 'assets/logotp.png',
        logoUrl: 'assets/logotp.png',
        faviconUrl: 'assets/logotp.png',
        heroGridBackground: 'assets/logo.png'
    },
    content: {
        heroHighlight: 'Yksilöllinen',
        heroEyebrow: 'Yksilöllinen sovelluskehitys & kyberturva',
        heroTitle: 'Yksilöllisten sovellusten koodaaminen juuri yrityksenne tarpeisiin.',
        heroTitleHtml: '<span class="hero-title-line">Yksilöllisten</span><span class="hero-title-line">Sovellusten</span><span class="hero-title-line">Valmistaminen</span><span class="hero-title-line hero-title-subline">- Juuri yrityksenne tarpeisiin.</span>',
        heroSubtitle: 'Sovelluksia <strong>kaikille alustoille</strong> – mobiilista työpöydälle. Kyberturva sisäänrakennettuna jokaisessa ratkaisussa.',
        serviceTagline: '"Koodia, joka kantaa – tänään ja huomenna."',
        serviceIntro: 'Toimitamme pienen toimivan version nopeasti – kasvatamme tarpeen mukaan.'
    },
    integrations: {
        chat: {
            enabled: true,
            provider: 'openai',
            endpoint: 'api/chat.php',
            model: 'gpt-4.1-mini',
            temperature: 0.6,
            systemPrompt: 'Toimi AnomFIN HyperLaunch -neuvojana. Vastaa suomeksi, ole asiantunteva, ystävällinen ja ytimekäs. Suosittele palveluitamme yritysasiakkaille.',
            greeting: 'Tervetuloa HyperLaunch-chattiin – luksissa, kyberturvassa ilmoittelussa – kysy rohkeasti.',
            followup: 'Olen AnomFIN chatBot, mitäs kaipailette?',
            avatarUrl: 'assets/logotp.png'
        }
    },
    shortener: {
        baseUrl: 'https://anomfin.fi/?s=',
        maxLength: 4,
        enforceHttps: true,
        autoPurgeDays: 365,
        redirectStatus: 302,
        utmCampaign: 'anomfin-hyperlaunch'
    }
};

async function applyGlobalSettings(){
    const root = document.documentElement;
    let settings = null;
    try {
        const response = await fetch('api/settings.php', { cache: 'no-store' });
        if (response.ok) {
            settings = await response.json();
        }
    } catch (error) {
        console.warn('Settings fetch failed, fallback to cache', error);
    }

    if (!settings) {
        try {
            if (typeof localStorage !== 'undefined') {
                const cached = localStorage.getItem('anomfin:lastSettings');
                if (cached) {
                    settings = JSON.parse(cached);
                }
            }
        } catch (error) {
            settings = null;
        }
    }

    if (!settings || typeof settings !== 'object') {
        settings = JSON.parse(JSON.stringify(ANOMFIN_DEFAULT_SETTINGS));
    }

    const cssVars = { ...ANOMFIN_DEFAULT_SETTINGS.cssVars, ...(settings.cssVars || {}) };
    Object.entries(cssVars).forEach(([key, value]) => {
        if (key && value != null) {
            root.style.setProperty(key, value);
        }
    });

    const behaviors = { ...ANOMFIN_DEFAULT_SETTINGS.behaviors, ...(settings.behaviors || {}) };
    const bodyEl = document.body || document.getElementsByTagName('body')[0];
    if (bodyEl) {
        bodyEl.dataset.reactHover = behaviors.reactHover === false ? '0' : '1';
        bodyEl.dataset.reactContact = behaviors.reactContact === false ? '0' : '1';
        bodyEl.dataset.heroMask = behaviors.heroMask === false ? '0' : '1';
        bodyEl.dataset.floatingGrid = behaviors.floatingGrid === true ? '1' : '0';
        bodyEl.dataset.hybercube = behaviors.hybercube === false ? '0' : '1';
        bodyEl.dataset.chatDock = behaviors.chatDock === false ? '0' : '1';
        const vibrationValue = typeof behaviors.pageVibration === 'number'
            ? Math.min(1, Math.max(0, behaviors.pageVibration))
            : 0;
        bodyEl.dataset.pageVibration = vibrationValue.toFixed(2);
        root.style.setProperty('--page-vibration', vibrationValue.toFixed(2));
    }

    const branding = { ...ANOMFIN_DEFAULT_SETTINGS.branding, ...(settings.branding || {}) };
    const content = { ...ANOMFIN_DEFAULT_SETTINGS.content, ...(settings.content || {}) };
    const shortener = { ...ANOMFIN_DEFAULT_SETTINGS.shortener, ...(settings.shortener || {}) };
    const rawIntegrations = settings.integrations || {};
    const chatIntegration = {
        ...ANOMFIN_DEFAULT_SETTINGS.integrations.chat,
        ...(rawIntegrations.chat || {})
    };
    const integrations = { chat: chatIntegration };

    applyBranding(branding);
    applyDynamicContent(content);

    window.__ANOMFIN_SETTINGS = {
        ...ANOMFIN_DEFAULT_SETTINGS,
        ...settings,
        cssVars,
        behaviors,
        branding,
        content,
        integrations,
        shortener
    };

    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('anomfin:lastSettings', JSON.stringify(window.__ANOMFIN_SETTINGS));
        }
    } catch (error) {
        // ignore cache failures
    }

    return window.__ANOMFIN_SETTINGS;
}

function formatCssUrl(url) {
    if (!url) return '';
    const trimmed = String(url).trim();
    if (/^url\(/i.test(trimmed)) {
        return trimmed;
    }
    const sanitized = trimmed.replace(/"/g, '\\"').replace(/'/g, "\\'");
    return `url('${sanitized}')`;
}

function applyBranding(branding = {}) {
    const navEmblem = document.querySelector('.nav-logo-emblem');
    const emblemSource = branding.navEmblemUrl || branding.logoUrl;
    if (navEmblem && emblemSource) {
        navEmblem.src = emblemSource;
        navEmblem.srcset = '';
    }

    const footerLogo = document.querySelector('.footer-brand img');
    if (footerLogo && branding.logoUrl) {
        footerLogo.src = branding.logoUrl;
        footerLogo.srcset = '';
    }

    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon && branding.faviconUrl) {
        favicon.href = branding.faviconUrl;
    }

    const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (appleIcon && branding.logoUrl) {
        appleIcon.href = branding.logoUrl;
    }

    if (branding.heroGridBackground) {
        document.documentElement.style.setProperty('--hero-grid-image', formatCssUrl(branding.heroGridBackground));
    }
}

let heroTitleAnimationTimeouts = [];
let heroTitleSpans = [];

function applyDynamicContent(content = {}) {
    const highlightEl = document.querySelector('[data-content-key="heroHighlight"]');
    const highlightValue = content.heroHighlight || highlightEl?.textContent || '';
    if (highlightEl && highlightValue) {
        highlightEl.textContent = highlightValue;
    }

    const eyebrowEl = document.querySelector('[data-content-key="heroEyebrow"]');
    if (eyebrowEl) {
        if (!eyebrowEl.dataset.baseText) {
            eyebrowEl.dataset.baseText = eyebrowEl.textContent.trim();
        }
        const baseText = content.heroEyebrow || eyebrowEl.dataset.baseText;
        const highlightNode = highlightEl || eyebrowEl.querySelector('[data-content-key="heroHighlight"]');
        if (highlightNode) {
            const normalizedBase = baseText || '';
            let remainder = normalizedBase;
            const highlightText = highlightNode.textContent || '';
            if (highlightText) {
                const lowerBase = normalizedBase.toLowerCase();
                const lowerHighlight = highlightText.toLowerCase();
                const index = lowerBase.indexOf(lowerHighlight);
                if (index !== -1) {
                    remainder = (normalizedBase.slice(0, index) + normalizedBase.slice(index + highlightText.length)).trim();
                }
            }
            eyebrowEl.innerHTML = '';
            highlightNode.classList.add('flare-boost');
            highlightNode.setAttribute('data-content-key', 'heroHighlight');
            eyebrowEl.appendChild(highlightNode);
            if (remainder) {
                eyebrowEl.appendChild(document.createTextNode(` ${remainder}`));
            }
        } else {
            eyebrowEl.textContent = baseText;
        }
    }

    const heroSubtitleEl = document.querySelector('[data-content-key="heroSubtitle"]');
    if (heroSubtitleEl && content.heroSubtitle) {
        heroSubtitleEl.innerHTML = content.heroSubtitle;
    }

    const serviceTagEl = document.querySelector('[data-content-key="serviceTagline"]');
    if (serviceTagEl && content.serviceTagline) {
        serviceTagEl.innerHTML = content.serviceTagline;
    }

    const serviceIntroEl = document.querySelector('[data-content-key="serviceIntro"]');
    if (serviceIntroEl && content.serviceIntro) {
        serviceIntroEl.innerHTML = content.serviceIntro;
    }

    const heroTitleContent = (content.heroTitleHtml && content.heroTitleHtml.trim().length)
        ? content.heroTitleHtml
        : content.heroTitle;
    setupHeroTitleAnimation(heroTitleContent);
}

function setupHeroTitleAnimation(newContent) {
    const heroTitle = document.querySelector('.hero-title');
    if (!heroTitle) return;

    if (!heroTitle.dataset.sourceContent) {
        heroTitle.dataset.sourceContent = heroTitle.innerHTML.trim();
    }

    const rawContent = typeof newContent === 'string' && newContent.trim().length
        ? newContent.trim()
        : heroTitle.dataset.sourceContent || heroTitle.innerHTML.trim();

    heroTitle.dataset.sourceContent = rawContent;

    heroTitleAnimationTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    heroTitleAnimationTimeouts = [];
    heroTitleSpans = [];

    heroTitle.innerHTML = '';

    const processText = (text, target) => {
        if (!text) return;
        const normalized = text.replace(/\r/g, '');
        for (const char of normalized) {
            if (char === '\n') {
                target.appendChild(document.createElement('br'));
                continue;
            }
            if (char === ' ') {
                target.appendChild(document.createTextNode(' '));
                continue;
            }
            const span = document.createElement('span');
            span.className = 'hero-letter';
            span.textContent = char;
            target.appendChild(span);
            heroTitleSpans.push(span);
        }
    };

    const allowedTags = new Set(['STRONG', 'EM', 'SPAN', 'SMALL', 'BR']);
    const allowedClass = /^[a-z0-9\-\s_]{0,64}$/i;

    const processNode = (node, target) => {
        if (!node) return;
        if (node.nodeType === Node.TEXT_NODE) {
            processText(node.textContent || '', target);
            return;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toUpperCase();
            if (!allowedTags.has(tagName)) {
                Array.from(node.childNodes).forEach(child => processNode(child, target));
                return;
            }
            if (tagName === 'BR') {
                target.appendChild(document.createElement('br'));
                return;
            }
            const element = document.createElement(node.tagName.toLowerCase());
            if ((tagName === 'SPAN' || tagName === 'SMALL') && node.hasAttribute('class')) {
                const cls = node.getAttribute('class') || '';
                if (allowedClass.test(cls)) {
                    element.className = cls;
                }
            }
            Array.from(node.childNodes).forEach(child => processNode(child, element));
            target.appendChild(element);
            return;
        }
        Array.from(node.childNodes).forEach(child => processNode(child, target));
    };

    const hasMarkup = /<[a-z][\s\S]*>/i.test(rawContent);
    heroTitle.classList.toggle('hero-title-rich', hasMarkup);

    if (hasMarkup) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(`<div>${rawContent}</div>`, 'text/html');
            Array.from(doc.body.childNodes).forEach(child => processNode(child, heroTitle));
        } catch (error) {
            processText(rawContent, heroTitle);
        }
    } else {
        processText(rawContent, heroTitle);
    }

    heroTitleSpans.forEach((span, index) => {
        span.classList.remove('hero-letter-active');
        const timeoutId = setTimeout(() => {
            span.classList.add('hero-letter-active');
        }, 110 * index + 180);
        heroTitleAnimationTimeouts.push(timeoutId);
    });
}

let heroFlashRef = null;
let heroFlashTimeout = null;

function setupHeroFlash() {
    if (heroFlashRef) return heroFlashRef;
    const visual = document.querySelector('.hero-visual');
    if (!visual) return null;
    heroFlashRef = document.createElement('div');
    heroFlashRef.className = 'hero-flash';
    visual.appendChild(heroFlashRef);
    return heroFlashRef;
}

function triggerHeroFlash() {
    const flash = heroFlashRef || setupHeroFlash();
    if (!flash) return;
    flash.classList.add('active');
    if (heroFlashTimeout) {
        clearTimeout(heroFlashTimeout);
    }
    heroFlashTimeout = setTimeout(() => {
        flash.classList.remove('active');
    }, 420);
}

function getPageVibrationFactor() {
    const body = document.body || document.getElementsByTagName('body')[0];
    const raw = body?.dataset?.pageVibration;
    const parsed = typeof raw === 'string' ? parseFloat(raw) : NaN;
    if (Number.isFinite(parsed)) {
        return Math.min(1, Math.max(0, parsed));
    }
    const fallback = window.__ANOMFIN_SETTINGS?.behaviors?.pageVibration;
    if (typeof fallback === 'number') {
        return Math.min(1, Math.max(0, fallback));
    }
    return 0;
}

// Smooth Scrolling for Navigation Links (skip skip-link)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        if (this.classList.contains('skip-link')) {
            return;
        }

        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar Background & logo glow on Scroll
window.addEventListener('scroll', updateNavbarChrome, { passive: true });

function initContactForm() {
    const contactForm = document.querySelector('.contact-form');
    if (!contactForm) return;

    const formStatus = contactForm.querySelector('.form-status');

    contactForm.addEventListener('submit', event => {
        event.preventDefault();

        const formData = new FormData(contactForm);
        const company = formData.get('company');
        const name = formData.get('name');
        const email = formData.get('email');
        const consentChecked = contactForm.querySelector('input[name="consent"]')?.checked;

        if (!company || !name || !email) {
            showNotification(MESSAGES.contact.requiredFields, 'error');
            formStatus.textContent = 'Täytä pakolliset kentät.';
            return;
        }

        if (!isValidEmail(email)) {
            showNotification(MESSAGES.contact.invalidEmail, 'error');
            formStatus.textContent = 'Virheellinen sähköpostiosoite.';
            return;
        }

        if (!consentChecked) {
            showNotification(MESSAGES.contact.consentRequired, 'error');
            formStatus.textContent = 'Hyväksy tietosuojaseloste.';
            return;
        }

        contactForm.reset();
        formStatus.textContent = 'Kiitos! Otamme yhteyttä 24 tunnin sisällä.';
        showNotification(MESSAGES.contact.success, 'success');
    });
}

function initLinkShortener() {
    const form = document.getElementById('short-link-form');
    if (!form) return;

    const targetInput = document.getElementById('shortener-target');
    const aliasInput = document.getElementById('shortener-alias');
    const statusEl = document.getElementById('shortener-status');
    const resultEl = document.getElementById('shortener-result');
    const linkEl = document.getElementById('shortener-link');
    const copyBtn = document.getElementById('shortener-copy');

    if (!targetInput || !aliasInput || !statusEl || !resultEl || !linkEl || !copyBtn) {
        return;
    }

    const shortenerSettings = window.__ANOMFIN_SETTINGS?.shortener || ANOMFIN_DEFAULT_SETTINGS.shortener;
    const baseUrl = shortenerSettings.baseUrl || 'https://anomfin.fi/?s=';
    const maxLength = Number(shortenerSettings.maxLength) || 4;
    const enforceHttps = shortenerSettings.enforceHttps !== false;

    const setStatus = (message, type = 'info') => {
        statusEl.textContent = message || '';
        statusEl.dataset.type = type;
    };

    const toggleLoading = (isLoading) => {
        const submitBtn = form.querySelector('.shortener-submit');
        if (submitBtn) {
            submitBtn.disabled = isLoading;
        }
        form.classList.toggle('is-loading', Boolean(isLoading));
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const urlValue = targetInput.value.trim();
        const aliasValue = aliasInput.value.trim();

        setStatus('');
        resultEl.hidden = true;

        if (!urlValue) {
            setStatus('Anna lyhennettävä URL.', 'error');
            targetInput.focus();
            return;
        }

        let parsedUrl;
        try {
            parsedUrl = new URL(urlValue);
        } catch (error) {
            setStatus('URL näyttää virheelliseltä – tarkista osoite.', 'error');
            targetInput.focus();
            return;
        }

        if (enforceHttps && parsedUrl.protocol !== 'https:') {
            setStatus('Lyhentäjä hyväksyy vain HTTPS-osoitteet – lisää suojattu linkki.', 'error');
            targetInput.focus();
            return;
        }

        if (aliasValue && (aliasValue.length > maxLength || !/^[A-Za-z0-9]+$/.test(aliasValue))) {
            setStatus(`Alias saa sisältää enintään ${maxLength} merkkiä (A-Z, 0-9).`, 'error');
            aliasInput.focus();
            return;
        }

        toggleLoading(true);
        setStatus('Luodaan lyhyt linkki...', 'info');

        try {
            const response = await fetch('tausta.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: parsedUrl.toString(),
                    alias: aliasValue || undefined,
                    maxLength
                })
            });

            if (!response.ok) {
                throw new Error(`Palvelin vastasi tilakoodilla ${response.status}`);
            }

            const data = await response.json();
            if (!data || !data.success) {
                const message = data?.error || 'Lyhennystä ei voitu luoda juuri nyt.';
                setStatus(message, 'error');
                showNotification(message, 'error');
                return;
            }

            const shortUrl = data.shortUrl || `${baseUrl}${data.code || ''}`;
            linkEl.textContent = shortUrl;
            linkEl.href = shortUrl;
            resultEl.hidden = false;
            setStatus('Lyhyt linkki luotu! Kopioi ja jaa turvallisesti.', 'success');
            showNotification(MESSAGES.linkShortener.success, 'success');
        } catch (error) {
            console.error('Link shortener error:', error);
            setStatus('Palvelimeen ei saatu yhteyttä. Yritä hetken kuluttua uudelleen.', 'error');
            showNotification(MESSAGES.linkShortener.error, 'error');
        } finally {
            toggleLoading(false);
        }
    });

    copyBtn.addEventListener('click', async () => {
        if (resultEl.hidden) {
            return;
        }
        const value = linkEl.href;
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(value);
            } else {
                const tempInput = document.createElement('input');
                tempInput.value = value;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                tempInput.remove();
            }
            setStatus('Lyhyt linkki kopioitu leikepöydälle.', 'success');
            showNotification(MESSAGES.linkShortener.copied, 'success');
        } catch (error) {
            console.error('Clipboard copy failed:', error);
            setStatus('Kopiointi epäonnistui – kopioi manuaalisesti.', 'error');
        }
    });
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(String(email).toLowerCase());
}

function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 90px;
        right: 24px;
        padding: 15px 20px;
        border-radius: 14px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 360px;
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.3);
    `;

    switch (type) {
        case 'success':
            notification.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
            break;
        case 'error':
            notification.style.background = 'linear-gradient(135deg, #dc3545, #e74c3c)';
            break;
        default:
            notification.style.background = 'linear-gradient(135deg, #00d4ff, #0099cc)';
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => {
        switch (char) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#39;';
            default: return char;
        }
    });
}

function safeUrl(url, fallback = '#') {
    const trimmed = String(url || '').trim();
    if (!trimmed) return fallback;
    if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('#') || trimmed.startsWith('/')) return trimmed;
    return fallback;
}

function initIntroOverlay() {
    const overlay = document.querySelector('.intro-overlay');
    if (!overlay) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        overlay.classList.add('intro-overlay-hidden');
        return;
    }

    const blackout = overlay.querySelector('.blackout');
    const logo = overlay.querySelector('.intro-logo');
    const grid = document.querySelector('.hero-grid');
    const orb = document.querySelector('.hero-orb');

    const cssMs = (name, def)=>{
        const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        if(!v) return def;
        if(v.endsWith('ms')) return parseFloat(v);
        if(v.endsWith('s')) return parseFloat(v)*1000;
        const n = parseFloat(v); return isNaN(n)?def:n;
    };
    const blackoutMs = cssMs('--intro-blackout-ms', 500);
    const moveDelayMs = cssMs('--logo-move-delay-ms', 600);
    const revealMs = cssMs('--logo-reveal-ms', 2500);

    // 0 - blackoutMs: pidä täysin mustana
    setTimeout(() => {
        // Aloita logon kirkastuminen ja tarkentuminen
        logo.style.opacity = '1';
        const root = document.documentElement;
        root.style.setProperty('--logo-blur', '0px');
        root.style.setProperty('--logo-brightness', '1');
        // Aloita taustan valkeneminen 3s ajan ja normalisoi flare
        blackout && blackout.classList.add('fade-out');
        document.body.classList.add('flare-normalize');

        // logo siirtyy kohti neliötä extra smooth (WAAPI)
        setTimeout(() => {
            if (!grid) return;
            const logoRect = logo.getBoundingClientRect();
            const gridRect = grid.getBoundingClientRect();

            const logoCx = logoRect.left + logoRect.width / 2;
            const logoCy = logoRect.top + logoRect.height / 2;
            const gridCx = gridRect.left + gridRect.width / 2;
            const gridCy = gridRect.top + gridRect.height / 2;

            const dx = gridCx - logoCx;
            const dy = gridCy - logoCy;
            const scale = Math.max(0.25, Math.min(0.5, (gridRect.width * 0.35) / (logoRect.width || 1)));

            const moveMs = cssMs('--logo-move-duration-ms', 1000);
            const varX = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--logo-arc-x')) || 0.65;
            const varDY = parseFloat((getComputedStyle(document.documentElement).getPropertyValue('--logo-arc-dy')||'').replace('px','')) || 60;
            const midX = dx * varX;
            const midY = dy * varX - varDY;
            const easingValue = getComputedStyle(document.documentElement).getPropertyValue('--logo-ease').trim() || 'cubic-bezier(.2,.8,.2,1)';
            const anim = logo.animate([
                { transform: 'translate(0px,0px) scale(1)' },
                { transform: `translate(${midX}px, ${midY}px) scale(${Math.max(1, scale*0.9)})` },
                { transform: `translate(${dx}px, ${dy}px) scale(${scale})` }
            ], { duration: moveMs, easing: easingValue, fill: 'forwards' });

            const onMoveEnd = () => {
                // Neliö reagoi: tärisee, kasvaa ~20% ja vaihtaa vihreäksi
                const fg = document.querySelector('.floating-grid');
                if (fg) {
                    fg.classList.add('fg-super');
                    window.AnomFIN_FG && window.AnomFIN_FG.supercharge && window.AnomFIN_FG.supercharge();
                }
                if (grid) {
                    grid.classList.add('square-excite', 'square-green');
                    
                    // Käytetään uutta smooth-arrival -animaatiota
                    const arrivalDuration = cssMs('--hero-arrival-duration-ms', 1300);
                    setTimeout(() => {
                        grid.classList.remove('square-excite');
                        grid.classList.add('lively');

                        // Trigger terminal transformation automaattisesti smooth-arrivalin jälkeen
                        setTimeout(() => {
                            activateRectangle();
                            
                            // Hide intro overlay AFTER logo has fully blended into hero-grid
                            // Wait for logo-entering animation (1000ms) + logo-blended transition (300ms)
                            setTimeout(() => {
                                overlay.style.opacity = '0';
                                overlay.style.transition = 'opacity .6s ease';
                                setTimeout(() => overlay.classList.add('intro-overlay-hidden'), 700);
                            }, 1400);
                        }, 500);
                    }, arrivalDuration);
                }
                orb && orb.classList.add('lively');
                anim.removeEventListener?.('finish', onMoveEnd);
            };
            anim.addEventListener?.('finish', onMoveEnd);
        }, moveDelayMs);
    }, blackoutMs);
}

function updateNavbarChrome() {
    if (!navbarRef) {
        navbarRef = document.querySelector('.navbar');
    }
    if (navbarRef) {
        navbarRef.style.background = window.scrollY > 100
            ? 'rgba(6, 7, 10, 0.95)'
            : 'rgba(6, 7, 10, 0.8)';
    }
    if (navLogoRef) {
        const glow = Math.min(1, Math.max(0, window.scrollY / 320));
        navLogoRef.style.setProperty('--nav-glow', glow.toFixed(2));
    }
}

function initNavLogoHalo(element) {
    const navLogo = element || document.querySelector('.nav-logo');
    if (!navLogo) return;

    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const clamp = (value) => Math.min(1, Math.max(0, value));

    let targetX = 0.5;
    let targetY = 0.5;
    let currentX = targetX;
    let currentY = targetY;
    let rafId;

    const updateVars = () => {
        navLogo.style.setProperty('--nav-lx', currentX.toFixed(3));
        navLogo.style.setProperty('--nav-ly', currentY.toFixed(3));
    };

    const center = () => {
        targetX = 0.5;
        targetY = 0.5;
        if (reduceMotionQuery.matches) {
            currentX = targetX;
            currentY = targetY;
            updateVars();
        }
    };

    const animate = () => {
        currentX += (targetX - currentX) * 0.18;
        currentY += (targetY - currentY) * 0.18;
        updateVars();
        rafId = requestAnimationFrame(animate);
    };

    const handlePointer = (event) => {
        const rect = navLogo.getBoundingClientRect();
        const nextX = clamp((event.clientX - rect.left) / rect.width);
        const nextY = clamp((event.clientY - rect.top) / rect.height);
        targetX = nextX;
        targetY = nextY;
        if (reduceMotionQuery.matches) {
            currentX = targetX;
            currentY = targetY;
            updateVars();
        }
    };

    navLogo.addEventListener('pointermove', handlePointer, { passive: true });
    navLogo.addEventListener('pointerdown', handlePointer, { passive: true });
    navLogo.addEventListener('pointerleave', center);
    navLogo.addEventListener('focus', center);
    navLogo.addEventListener('blur', center);

    center();
    updateVars();

    if (!reduceMotionQuery.matches) {
        rafId = requestAnimationFrame(animate);
    }

    reduceMotionQuery.addEventListener?.('change', (event) => {
        if (event.matches) {
            if (rafId) cancelAnimationFrame(rafId);
            currentX = targetX;
            currentY = targetY;
            updateVars();
        } else {
            currentX = targetX;
            currentY = targetY;
            rafId = requestAnimationFrame(animate);
        }
    });
}

function initScrollCompanion() {
    const sections = Array.from(document.querySelectorAll('section[id]'));
    if (!sections.length) return;

    // Detect if mobile device
    const isMobile = window.innerWidth <= 800;
    const allowChatDock = (document.body?.dataset?.chatDock ?? '1') !== '0';

    const companion = document.createElement('aside');
    companion.className = 'scroll-companion';
    if (isMobile) {
        companion.classList.add('mobile-softamme');
    }
    companion.setAttribute('aria-label', isMobile ? 'AnomFIN | Softamme' : 'AnomFIN | AnomTools vierityshyperkuutio');
    
    // Different content for mobile vs desktop
    const headerContent = isMobile ? `
        <div class="companion-logo">
            <span class="companion-logo-main">AnomFIN</span>
            <span class="companion-logo-sub">Softamme</span>
        </div>
        <span class="companion-spark">Open Source</span>
    ` : `
        <div class="companion-header-main">
            <div class="companion-logo">
                <span class="companion-logo-main">AnomFIN</span>
                <span class="companion-logo-sub">24/7 CHAT</span>
            </div>
            <span class="companion-spark">Scroll Sync</span>
        </div>
    `;
    
    const quoteContent = isMobile ? 
        'Avoin lähdekoodi, vahva yhteisö. AnomFIN, AnomTools, Jugi-ekosysteemi – Kali Linux ja Ubuntu v22.04 tukevat kehitystyötä.' : 
        'Vieritysmatriisi näyttää missä kohtaa kyberturva- ja sovelluspolkua kuljet.';
    
    const chatToggleMarkup = (isMobile || !allowChatDock) ? '' : `
            <div class="companion-chat-toggle" role="group" aria-label="Sulava AI-Chat">
                <span class="companion-chat-toggle-label">Sulava AI-Chat</span>
                <label class="companion-chat-toggle-control">
                    <input type="checkbox" class="companion-chat-toggle-input" checked>
                    <span class="companion-chat-toggle-track" aria-hidden="true">
                        <span class="companion-chat-toggle-thumb"></span>
                    </span>
                    <span class="companion-chat-toggle-state">On</span>
                </label>
            </div>
    `;

    const chatDockMarkup = (isMobile || !allowChatDock) ? '' : `
            <div class="chat-dock" id="chat-dock" aria-live="polite">
                <p class="sr-only">HyperLaunch chat -paneeli</p>
            </div>
    `;

    companion.innerHTML = `
        <div class="companion-core">
            <div class="companion-header">
                ${headerContent}
            </div>
            ${chatToggleMarkup}
            <p class="companion-quote">${quoteContent}</p>
            <div class="companion-progress" role="status" aria-live="polite">
                <svg viewBox="0 0 120 120" class="companion-progress-ring" aria-hidden="true">
                    <defs>
                        <linearGradient id="anomfin-companion-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#00ffa6"></stop>
                            <stop offset="100%" stop-color="#00d4ff"></stop>
                        </linearGradient>
                    </defs>
                    <circle class="ring-bg" cx="60" cy="60" r="52"></circle>
                    <circle class="ring-fg" cx="60" cy="60" r="52"></circle>
                </svg>
                <div class="companion-progress-info">
                    <span class="progress-label">Scroll Sync</span>
                    <span class="progress-value">0%</span>
                </div>
            </div>
            <div class="companion-section-grid">
                <div class="section-card section-card-active">
                    <span class="section-label">Nyt</span>
                    <span class="section-title">Etusivu</span>
                </div>
                <div class="section-card section-card-next">
                    <span class="section-label">Seuraava</span>
                    <span class="section-title">Palvelut</span>
                </div>
            </div>
            <div class="companion-trail" aria-hidden="true"></div>
            ${chatDockMarkup}
        </div>
    `;

    document.body.appendChild(companion);

    const chatToggleInput = companion.querySelector('.companion-chat-toggle-input');
    const chatStateLabel = companion.querySelector('.companion-chat-toggle-state');

    const updateCompanionChatState = (expanded) => {
        const isExpanded = Boolean(expanded);
        if (chatToggleInput) {
            chatToggleInput.checked = isExpanded;
        }
        if (chatStateLabel) {
            chatStateLabel.textContent = isExpanded ? 'On' : 'Off';
        }
        companion.classList.toggle('chat-panel-active', isExpanded);
        companion.classList.toggle('chat-panel-idle', !isExpanded);
    };

    if (chatToggleInput) {
        chatToggleInput.checked = false;
        chatToggleInput.disabled = true;
        updateCompanionChatState(false);

        chatToggleInput.addEventListener('change', () => {
            const targetState = chatToggleInput.checked;
            if (typeof window.__anomfinChatSetExpanded === 'function') {
                window.__anomfinChatSetExpanded(targetState);
            } else {
                updateCompanionChatState(targetState);
            }
        });

        document.addEventListener('anomfin:chat-ready', (event) => {
            chatToggleInput.disabled = false;
            updateCompanionChatState(Boolean(event?.detail?.expanded ?? true));
        });

        document.addEventListener('anomfin:chat-expanded', (event) => {
            if (!event || typeof event.detail?.expanded === 'undefined') return;
            updateCompanionChatState(Boolean(event.detail.expanded));
        });

        document.addEventListener('anomfin:chat-availability', (event) => {
            const available = Boolean(event?.detail?.available ?? true);
            chatToggleInput.disabled = !available;
            companion.classList.toggle('chat-panel-disabled', !available);
        });

        document.addEventListener('anomfin:chat-fullscreen', (event) => {
            const active = Boolean(event?.detail?.expanded);
            companion.classList.toggle('chat-panel-fullscreen', active);
        });
    }

    const progressValue = companion.querySelector('.progress-value');
    const ring = companion.querySelector('.ring-fg');
    const sectionActive = companion.querySelector('.section-card-active .section-title');
    const sectionNext = companion.querySelector('.section-card-next .section-title');
    const spark = companion.querySelector('.companion-spark');
    const quote = companion.querySelector('.companion-quote');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const circumference = Math.PI * 2 * 52;
    if (ring) {
        ring.setAttribute('stroke', 'url(#anomfin-companion-gradient)');
        ring.style.strokeDasharray = circumference.toFixed(2);
        ring.style.strokeDashoffset = circumference.toFixed(2);
    }

    const sectionTitles = {
        home: 'Etusivu',
        services: 'Palvelut',
        platforms: 'Alustat',
        applications: 'Sovellukset',
        softamme: 'Softamme',
        security: 'Kyberturva',
        pricing: 'Hinnoittelu',
        contact: 'Yhteys'
    };

    const sparkMap = isMobile ? {
        home: 'Open Source',
        services: 'AnomTools',
        platforms: 'Jugi Ecosystem',
        applications: 'GitHub Portfolio',
        security: 'JugiBot',
        pricing: 'Teboil',
        contact: 'Ubuntu v22.04'
    } : {
        home: 'HyperLaunch',
        services: 'Build Sprint',
        platforms: 'Omni Deploy',
        applications: 'GitHub Projects',
        softamme: 'Open Source',
        security: 'SOC Hyperwatch',
        pricing: 'Selkeä hinnoittelu',
        contact: 'Yhteys valmis'
    };

    const quoteMap = isMobile ? {
        home: 'Avoin lähdekoodi, vahva yhteisö. AnomFIN, AnomTools, Jugi-ekosysteemi – Kali Linux ja Ubuntu v22.04 tukevat kehitystyötä.',
        services: 'AnomTools: työkalupaketti tehokkaaseen kehitykseen ja kyberturva-analyysiin.',
        platforms: 'JugiTube, JugiBot, JugiTools – Suomalaista avointa teknologiaa kaikille.',
        applications: 'GitHub-projektimme ovat avoimia kaikille. Tutki, opi ja osallistu!',
        security: 'JugiBot ja automatisoidut työkalut varmistavat jatkuvan kyberturvatason.',
        pricing: 'Kali Linux ja Ubuntu v22.04 – luotettavat alustat kaikkeen kehitykseen.',
        contact: 'Teboil-vahvuus ja tehokkuus – turvallinen matka tulevaisuuteen.'
    } : {
        home: 'Vieritysmatriisi näyttää missä kohtaa kyberturva- ja sovelluspolkua kuljet.',
        services: 'Sprinttaa MVP tuotantoon – AnomTools valvoo laatua ja turvaa.',
        platforms: 'Julkaisemme yhdellä koodipohjalla kaikkiin päätelaitteisiin.',
        applications: 'Toteutetut projektit ja avoimet työkalut – inspiraatiota seuraavaan.',
        softamme: 'Avoimen lähdekoodin periaatteet ja AnomFIN GitHub-projektit.',
        security: 'SOC Hyperwatch tarkkailee uhkia yhtä herkästi kuin liikegraafi.',
        pricing: 'Hinnoittelu pysyy kristallinkirkkaana koko matkan.',
        contact: 'Jutellaan – viedään ideasi tuotantoon turvallisesti.'
    };

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const deriveSectionTitle = (section) => {
        if (!section) return '';
        const heading = section.querySelector('h1, h2, h3');
        return heading ? heading.textContent.trim() : section.id.replace(/-/g, ' ');
    };

    let isCompact = false;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId;

    const marginDesktop = 36;
    const marginMobile = 18;

    const computeCompact = () => {
        const compact = window.innerWidth <= 768;
        if (compact !== isCompact) {
            isCompact = compact;
            companion.classList.toggle('compact', compact);
        }
        return compact;
    };

    const updateSections = () => {
        const midline = window.innerHeight * (isCompact ? 0.55 : 0.35);
        let currentSection = sections[0] || null;
        let nextSection = sections[1] || null;

        for (let i = 0; i < sections.length; i += 1) {
            const section = sections[i];
            const rect = section.getBoundingClientRect();
            if (rect.top <= midline && rect.bottom > midline) {
                currentSection = section;
                nextSection = sections[i + 1] || null;
                break;
            }
            if (rect.top > midline) {
                currentSection = sections[i - 1] || section;
                nextSection = section;
                break;
            }
        }

        const currentId = currentSection?.id || sections[0]?.id || '';
        const nextId = nextSection?.id || '';

        if (sectionActive) {
            sectionActive.textContent = sectionTitles[currentId] || deriveSectionTitle(currentSection) || 'Etusivu';
        }
        if (sectionNext) {
            sectionNext.textContent = nextId ? (sectionTitles[nextId] || deriveSectionTitle(nextSection)) : 'Valmis';
        }
        if (spark) {
            spark.textContent = sparkMap[currentId] || 'Scroll Sync';
        }
        if (quote) {
            quote.textContent = quoteMap[currentId] || quoteMap.home;
        }

        companion.dataset.activeSection = currentId;
    };

    const updateProgress = () => {
        const sy = window.scrollY || document.documentElement.scrollTop || 0;
        const vh = window.innerHeight;
        const docH = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - vh;
        const ratio = docH > 0 ? clamp(sy / docH, 0, 1) : 0;
        if (progressValue) {
            const pct = Math.round(ratio * 100);
            progressValue.textContent = `${pct}%`;
        }
        companion.style.setProperty('--scroll-progress', ratio.toFixed(3));
        if (ring) {
            ring.style.strokeDashoffset = (circumference - ratio * circumference).toFixed(2);
        }
        return ratio;
    };

    const updateTargets = (ratio) => {
        const width = companion.offsetWidth || 280;
        const height = companion.offsetHeight || 260;
        const margin = isCompact ? marginMobile : marginDesktop;

        if (isCompact) {
            const baseX = (window.innerWidth - width) / 2;
            const maxX = window.innerWidth - width - margin;
            targetX = clamp(baseX, margin, Math.max(margin, maxX));
            const maxY = window.innerHeight - height - margin;
            targetY = clamp(maxY, margin, maxY);
        } else {
            const sway = Math.sin((window.scrollY || 0) * 0.004) * 22 * getPageVibrationFactor();
            const baseX = window.innerWidth - width - margin;
            targetX = clamp(baseX - ratio * 40 + sway, margin, window.innerWidth - width - margin + 20);
            const baseY = window.innerHeight * 0.28;
            const parallax = (window.scrollY || 0) * 0.12;
            const maxY = window.innerHeight - height - margin;
            targetY = clamp(baseY + parallax, margin, maxY);
        }
    };

    const applyImmediateTransform = () => {
        companion.style.transform = `translate3d(${Math.round(currentX)}px, ${Math.round(currentY)}px, 0)`;
    };

    const handleFlow = () => {
        computeCompact();
        const ratio = updateProgress();
        updateTargets(ratio);
        updateSections();
        if (reduceMotion.matches) {
            currentX = targetX;
            currentY = targetY;
            applyImmediateTransform();
        }
    };

    const animate = () => {
        currentX += (targetX - currentX) * 0.16;
        currentY += (targetY - currentY) * 0.16;
        applyImmediateTransform();
        rafId = requestAnimationFrame(animate);
    };

    handleFlow();
    currentX = targetX;
    currentY = targetY;
    applyImmediateTransform();

    requestAnimationFrame(() => companion.classList.add('ready'));

    if (!reduceMotion.matches) {
        rafId = requestAnimationFrame(animate);
    }

    window.addEventListener('scroll', handleFlow, { passive: true });
    window.addEventListener('resize', handleFlow);

    reduceMotion.addEventListener?.('change', (event) => {
        if (event.matches) {
            if (rafId) cancelAnimationFrame(rafId);
            currentX = targetX;
            currentY = targetY;
            applyImmediateTransform();
        } else {
            currentX = targetX;
            currentY = targetY;
            rafId = requestAnimationFrame(animate);
        }
    });

    if (!isMobile && allowChatDock) {
        initChatWidget();
    }

    // Add mobile trigger button for Softamme on mobile devices
    if (isMobile) {
        const triggerButton = document.createElement('button');
        triggerButton.className = 'softamme-trigger';
        triggerButton.innerHTML = '✨';
        triggerButton.setAttribute('aria-label', 'Toggle Softamme');
        triggerButton.setAttribute('title', 'Open/Close Softamme');
        
        let isActive = false;
        
        triggerButton.addEventListener('click', () => {
            isActive = !isActive;
            companion.classList.toggle('softamme-active', isActive);
            triggerButton.classList.toggle('active', isActive);
            triggerButton.innerHTML = isActive ? '✕' : '✨';
            
            // Position Softamme in center when activated
            if (isActive) {
                const width = companion.offsetWidth || 280;
                const height = companion.offsetHeight || 260;
                const centerX = (window.innerWidth - width) / 2;
                const centerY = (window.innerHeight - height) / 2;
                companion.style.setProperty('--softamme-x', `${centerX}px`);
                companion.style.setProperty('--softamme-y', `${centerY}px`);
            }
        });
        
        document.body.appendChild(triggerButton);
    }
}

// Floating grid that follows scroll with smoothing and reacts to sections
(function(){
  let rafId=null, lastY=0, lastX=0, targetY=0, targetX=0, scaleCur=1, scaleTarget=1;
  function lerp(a,b,t){ return a + (b-a)*t; }
  function initFloatingGrid(){
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const src = document.querySelector('.hero-grid');
    if(!src || prefersReduced) return;
    const allowFloating = (document.body?.dataset?.floatingGrid === '1');
    if (!allowFloating) return;
    const fg = src.cloneNode(true);
    fg.classList.add('floating-grid','fg-active');
    fg.setAttribute('aria-hidden','true');
    document.body.appendChild(fg);
    // caption element
    const cap = document.createElement('div');
    cap.className = 'floating-caption';
    cap.innerHTML = '<span>AnomFIN · Yksilölliset ratkaisut</span>';
    fg.appendChild(cap);
    
    // Add matrix-style digital rain effect to floating grid
    const matrixCanvas = document.createElement('canvas');
    matrixCanvas.className = 'matrix-rain-canvas';
    matrixCanvas.width = 280;
    matrixCanvas.height = 180;
    matrixCanvas.style.cssText = `
        position: absolute;
        inset: 0;
        border-radius: inherit;
        opacity: 0.6;
        mix-blend-mode: screen;
        pointer-events: none;
    `;
    fg.appendChild(matrixCanvas);
    
    // Matrix rain animation
    const ctx = matrixCanvas.getContext('2d');
    const chars = 'ANOMFIN010110100101CYBERSEC01101HYPERFLUX010101'.split('');
    const fontSize = 12;
    const columns = Math.floor(matrixCanvas.width / fontSize);
    const drops = Array(columns).fill(1);
    
    let matrixActive = false; // Start dormant
    let matrixOpacity = 0; // Start with 0 opacity for smooth transition
    
    const drawMatrix = () => {
        if (!matrixActive) return; // Don't draw if dormant
        
        // Semi-transparent black to create fade effect
        ctx.fillStyle = 'rgba(6, 7, 10, 0.08)';
        ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
        
        // Gradually increase opacity when active
        if (matrixOpacity < 0.5) {
            matrixOpacity = Math.min(0.5, matrixOpacity + 0.02);
            matrixCanvas.style.opacity = matrixOpacity;
        }
        
        ctx.fillStyle = '#00ffa6';
        ctx.font = `${fontSize}px monospace`;
        
        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            const x = i * fontSize;
            const y = drops[i] * fontSize;
            
            // Add glow effect to some characters
            if (Math.random() > 0.95) {
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#00ffa6';
            } else {
                ctx.shadowBlur = 0;
            }
            
            ctx.fillText(text, x, y);
            
            // Reset drop to top randomly or continue falling
            if (y > matrixCanvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    };
    
    // Set initial canvas opacity to 0 (dormant state)
    matrixCanvas.style.opacity = '0';
    
    // Function to activate matrix rain
    const activateMatrix = () => {
        if (!matrixActive) {
            matrixActive = true;
            fg.classList.add('matrix-active');
        }
    };
    
    // Function to deactivate matrix rain
    const deactivateMatrix = () => {
        if (matrixActive) {
            matrixActive = false;
            matrixOpacity = 0;
            matrixCanvas.style.opacity = '0';
            fg.classList.remove('matrix-active');
            // Clear the canvas
            ctx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
        }
    };
    
    // Run matrix animation at ~20fps for performance
    let matrixInterval = setInterval(drawMatrix, 50);
    
    // Pause matrix when page is hidden to save resources
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            clearInterval(matrixInterval);
        } else {
            matrixInterval = setInterval(drawMatrix, 50);
        }
    });
    
    // Intersection detection between left-edge-box and floating-grid
    const checkIntersection = () => {
        const leftBox = document.querySelector('.left-edge-box');
        if (!leftBox) {
            requestAnimationFrame(checkIntersection);
            return;
        }
        
        const leftBoxRect = leftBox.getBoundingClientRect();
        const fgRect = fg.getBoundingClientRect();
        
        // Check if boxes intersect
        const intersects = !(leftBoxRect.right < fgRect.left || 
                           leftBoxRect.left > fgRect.right || 
                           leftBoxRect.bottom < fgRect.top || 
                           leftBoxRect.top > fgRect.bottom);
        
        if (intersects) {
            activateMatrix();
            leftBox.classList.add('mask-in-terminal');
        } else {
            deactivateMatrix();
            leftBox.classList.remove('mask-in-terminal');
        }
        
        requestAnimationFrame(checkIntersection);
    };
    
    // Start intersection detection after a short delay to ensure left-edge-box is created
    setTimeout(() => {
        requestAnimationFrame(checkIntersection);
    }, 500);
    
    const loop = ()=>{
      const t = 0.12; // smoothing
      lastY = lerp(lastY, targetY, t);
      lastX = lerp(lastX, targetX, t);
      scaleCur = lerp(scaleCur, scaleTarget, 0.1);
      fg.style.transform = `translate(${Math.round(lastX)}px, ${Math.round(lastY)}px) scale(${scaleCur})`;
      rafId = requestAnimationFrame(loop);
    };
    const onScroll = ()=>{
      const sy = window.scrollY || document.documentElement.scrollTop || 0;
      const vh = window.innerHeight; const vw = window.innerWidth;
      const docH = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - vh;
      const p = docH>0 ? Math.min(1, Math.max(0, sy / docH)) : 0;
      // follow at ~22% viewport + parallax factor
      targetY = sy * 0.12 + vh * 0.22;
      // left→right across viewport with gentle sway
      targetX = (vw * (0.15 + 0.7 * p)) + Math.sin(sy * 0.004) * 30 * getPageVibrationFactor() - (vw * 0.5);
      
      // Sync matrix animation speed with scroll
      const scrollSpeed = Math.abs(sy - (window.lastScrollY || 0));
      window.lastScrollY = sy;
      
      // Speed up matrix drops based on scroll speed
      if (scrollSpeed > 5) {
        // Temporarily speed up the matrix
        clearInterval(matrixInterval);
        matrixInterval = setInterval(drawMatrix, Math.max(20, 50 - scrollSpeed * 2));
        
        // Reset to normal speed after a short delay
        setTimeout(() => {
          clearInterval(matrixInterval);
          if (!document.hidden) {
            matrixInterval = setInterval(drawMatrix, 50);
          }
        }, 500);
      }
    };
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        const id = e.target.id;
        if(e.isIntersecting){
          fg.classList.remove('fg-on-services','fg-on-security','fg-on-pricing','fg-on-contact');
          if(id==='services') fg.classList.add('fg-on-services');
          if(id==='security') fg.classList.add('fg-on-security');
          if(id==='pricing') fg.classList.add('fg-on-pricing');
          if(id==='contact') fg.classList.add('fg-on-contact');
          // dynamic caption per section
          let text = 'AnomFIN · Yksilölliset ratkaisut';
          if(id==='services') text = 'Rakenna nopeasti, skaalaa fiksusti';
          if(id==='security') text = 'Kyberturva arjessa, ei paperilla';
          if(id==='pricing') text = 'Selkeä hinnoittelu, ei yllätyksiä';
          if(id==='contact') text = 'Jutellaan – viedään ideasi tuotantoon';
          cap.innerHTML = `<span>${text}</span>`;
          fg.classList.add('fg-caption-show');
        }
      });
    },{ threshold: 0.3 });
    ['services','security','pricing','contact'].forEach(id=>{
      const el = document.getElementById(id); if(el) io.observe(el);
    });
    window.addEventListener('scroll', onScroll, { passive:true });
    // hide original to avoid duplicates
    src.classList.add('hidden-floating');
    onScroll();
    loop();
    // expose supercharge
    window.AnomFIN_FG = {
      supercharge(){
        const root = getComputedStyle(document.documentElement);
        const end = parseFloat(root.getPropertyValue('--square-scale-end')) || 1.25;
        scaleTarget = Math.max(end, 1.1);
        const fgEl = document.querySelector('.floating-grid');
        if(fgEl) fgEl.classList.add('fg-super');
        setTimeout(()=>{ scaleTarget = 1; }, 1600);
      }
    };
    // optional reactions
    const reactHover = document.body.dataset.reactHover !== '0';
    if(reactHover){
      document.querySelectorAll('.service-card').forEach(card=>{
        card.addEventListener('mouseenter', ()=>{ scaleTarget = 1.15; });
        card.addEventListener('mouseleave', ()=>{ scaleTarget = 1; });
      });
    }
  }
  // start after DOM ready + small delay for intro
  document.addEventListener('DOMContentLoaded', ()=> setTimeout(initFloatingGrid, 1200));
})();

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

function initScrollReveal() {
    const elements = document.querySelectorAll('.service-card, .price-card, .security-cta, .platform-chip');
    const reveal = () => {
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 140;
            if (elementTop < window.innerHeight - elementVisible) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };

    elements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    window.addEventListener('scroll', throttle(reveal, 200));
    reveal();
}

function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

// Matrix animation and logo-rectangle interaction
let matrixAnimationActive = false;
let intersectionDetectionEnabled = true;

function initLogoRectangleInteraction() {
    const logo = document.querySelector('.nav-logo-symbol');
    const rectangle = document.querySelector('.hero-grid');

    if (!logo || !rectangle) return;

    let rafId;
    let lastIntersection = false;

    const checkIntersection = () => {
        if (!intersectionDetectionEnabled) return;

        const logoRect = logo.getBoundingClientRect();
        const rectRect = rectangle.getBoundingClientRect();

        // Calculate if logo intersects with rectangle
        const intersects = !(logoRect.right < rectRect.left || 
                           logoRect.left > rectRect.right || 
                           logoRect.bottom < rectRect.top || 
                           logoRect.top > rectRect.bottom);

        if (intersects && !lastIntersection) {
            // Intersection started
            activateRectangle();
            lastIntersection = true;
        } else if (!intersects && lastIntersection) {
            // Intersection ended
            lastIntersection = false;
        }

        rafId = requestAnimationFrame(checkIntersection);
    };

    // Start intersection detection
    rafId = requestAnimationFrame(checkIntersection);

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        if (rafId) cancelAnimationFrame(rafId);
    });
}

function activateRectangle() {
    const rectangle = document.querySelector('.hero-grid');
    if (!rectangle || matrixAnimationActive) return;

    // Disable further intersection detection once activated
    intersectionDetectionEnabled = false;

    // Add logo blending class first
    triggerHeroFlash();
    rectangle.classList.add('logo-entering');
    
    // After logo blends in, activate terminal and start matrix animation
    setTimeout(() => {
        rectangle.classList.remove('logo-entering');
        rectangle.classList.add('logo-blended', 'rectangle-activated');
        
        // Trigger terminal transformation (HULK effect) after logo blending
        setTimeout(() => {
            rectangle.classList.add('terminal-transform');
            
            // Trigger matrix animation after terminal transformation starts
            setTimeout(() => {
                launchMatrixAnimation(rectangle);
            }, 300);
        }, 300);
    }, 1000); // Wait for logo blend animation to complete
}

function launchMatrixAnimation(fromElement) {
    if (matrixAnimationActive) return;
    matrixAnimationActive = true;
    triggerHeroFlash();

    const rect = fromElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Create matrix container
    const matrixContainer = document.createElement('div');
    matrixContainer.className = 'matrix-animation-container';
    matrixContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 900;
        overflow: hidden;
    `;

    document.body.appendChild(matrixContainer);

    // Create multiple matrix streams
    const numStreams = 20;
    const streams = [];

    for (let i = 0; i < numStreams; i++) {
        const stream = createMatrixStream(centerX, centerY, i);
        matrixContainer.appendChild(stream);
        streams.push(stream);
    }

    // After the burst animation, start continuous matrix rain inside terminal
    setTimeout(() => {
        startContinuousMatrixRain(fromElement);
    }, 2000);

    // Remove burst animation after completion
    setTimeout(() => {
        matrixContainer.remove();
        matrixAnimationActive = false;
        
        // Keep logo blended and activation classes
        // Don't remove rectangle-activated to keep the glow
    }, 4000);
}

// Make functions globally accessible for testing (console access only)
window.launchMatrixAnimation = launchMatrixAnimation;
window.activateRectangle = activateRectangle;

function createMatrixStream(originX, originY, index) {
    const stream = document.createElement('div');
    stream.className = 'matrix-stream';
    
    // Calculate direction - spread streams in different directions
    const angle = (index / 20) * Math.PI * 2;
    const speed = 2 + Math.random() * 3;
    const length = 150 + Math.random() * 300;
    
    const dx = Math.cos(angle) * length;
    const dy = Math.sin(angle) * length;
    
    stream.style.cssText = `
        position: absolute;
        left: ${originX}px;
        top: ${originY}px;
        width: 2px;
        height: 2px;
        background: #00ffa6;
        box-shadow: 0 0 10px #00ffa6, 0 0 20px #00ffa6, 0 0 30px #00ffa6;
        border-radius: 50%;
        animation: matrixTrail ${speed}s ease-out forwards;
        animation-delay: ${index * 50}ms;
        --trail-dx: ${dx}px;
        --trail-dy: ${dy}px;
    `;

    // Add trailing particles
    for (let j = 0; j < 8; j++) {
        const particle = document.createElement('div');
        particle.className = 'matrix-particle';
        const particleDx = dx * (0.6 + j * 0.05);
        const particleDy = dy * (0.6 + j * 0.05);
        
        particle.style.cssText = `
            position: absolute;
            width: 1px;
            height: 1px;
            background: rgba(0, 255, 166, ${0.8 - j * 0.1});
            border-radius: 50%;
            animation: matrixParticle ${speed + 0.5}s ease-out forwards;
            animation-delay: ${index * 50 + j * 25}ms;
            --particle-dx: ${particleDx}px;
            --particle-dy: ${particleDy}px;
        `;
        stream.appendChild(particle);
    }

    return stream;
}

// Continuous matrix rain inside terminal after activation
function startContinuousMatrixRain(terminal) {
    // Check if already has matrix rain
    if (terminal.querySelector('.terminal-matrix-canvas')) return;
    
    // Add logo background to terminal if not already present
    if (!terminal.querySelector('.terminal-logo-bg')) {
        const logoBg = document.createElement('div');
        logoBg.className = 'terminal-logo-bg';
        logoBg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: url('assets/logo.png');
            background-size: 52%;
            background-position: center;
            background-repeat: no-repeat;
            opacity: 0.5;
            pointer-events: none;
            z-index: 1;
            animation: logoBreath 5s ease-in-out infinite;
            mix-blend-mode: screen;
        `;
        terminal.appendChild(logoBg);
    }
    
    // Create canvas for matrix rain
    const canvas = document.createElement('canvas');
    canvas.className = 'terminal-matrix-canvas';
    canvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 2;
    `;
    
    terminal.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    const rect = terminal.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // Matrix characters - include AnomFIN, AnomTools, JugiBot, JugiTools as complete words
    const textSnippets = ['AnomFIN', 'AnomTools', 'JugiBot', 'JugiTools', 'CYBER', 'HYPERFLUX', '01', '10', '11', '00'];
    const fontSize = 12;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);
    const columnTexts = Array(columns).fill(null).map(() => null); // Track current text for each column
    
    const drawMatrix = () => {
        // Semi-transparent black to create fade effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#00ffa6';
        ctx.font = `${fontSize}px monospace`;
        
        for (let i = 0; i < drops.length; i++) {
            // Select a text snippet or single character for this column
            if (columnTexts[i] === null || drops[i] === 1) {
                // Choose between full words and single characters
                if (Math.random() > 0.5) {
                    columnTexts[i] = textSnippets[Math.floor(Math.random() * textSnippets.length)];
                } else {
                    // Single random character for variety
                    const singleChars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    columnTexts[i] = singleChars[Math.floor(Math.random() * singleChars.length)];
                }
            }
            
            const text = columnTexts[i];
            const x = i * fontSize;
            const y = drops[i] * fontSize;
            
            // Add glow effect to some characters
            if (Math.random() > 0.95) {
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#00ffa6';
            } else {
                ctx.shadowBlur = 0;
            }
            
            ctx.fillText(text, x, y);
            
            // Reset drop to top randomly or continue falling
            if (y > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
                columnTexts[i] = null; // Reset text for next drop
            }
            drops[i]++;
        }
    };
    
    // Run matrix animation at ~20fps for performance
    let matrixInterval = setInterval(drawMatrix, 50);
    
    // Pause matrix when page is hidden to save resources
    const visibilityHandler = () => {
        if (document.hidden) {
            clearInterval(matrixInterval);
        } else {
            matrixInterval = setInterval(drawMatrix, 50);
        }
    };
    
    document.addEventListener('visibilitychange', visibilityHandler);
    
    // Cleanup function (optional - can be used to stop the animation later)
    terminal._stopMatrixRain = () => {
        clearInterval(matrixInterval);
        document.removeEventListener('visibilitychange', visibilityHandler);
        canvas.remove();
    };
}

// Left-edge floating green box with cyclops eye effect
function initLeftEdgeBox() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const leftBox = document.createElement('div');
    leftBox.className = 'left-edge-box';
    leftBox.setAttribute('aria-hidden', 'true');
    
    // Create mask overlay for cyclops eye effect
    const maskOverlay = document.createElement('div');
    maskOverlay.className = 'left-edge-mask';
    leftBox.appendChild(maskOverlay);
    
    document.body.appendChild(leftBox);

    // Perlin-like noise animation for floating effect
    let time = 0;
    let baseY = window.innerHeight * 0.35; // Start at 35% of viewport height
    
    const noise = (x) => {
        // Simple pseudo-random noise function
        const s = Math.sin(x * 0.3) * Math.cos(x * 0.17);
        const c = Math.cos(x * 0.23) * Math.sin(x * 0.13);
        return (s + c) / 2;
    };

    const animate = () => {
        time += 0.015; // Slow animation speed
        
        // Calculate floating position with noise
        const noiseX = noise(time) * 25; // X movement amplitude
        const noiseY = noise(time + 100) * 40; // Y movement amplitude (offset for variety)
        const slowWave = Math.sin(time * 0.5) * 15; // Additional slow wave
        
        const targetY = baseY + noiseY + slowWave;
        
        // Keep box on left edge with slight horizontal sway
        leftBox.style.transform = `translate(${noiseX}px, ${targetY}px)`;
        
        requestAnimationFrame(animate);
    };

    // Update base Y position on window resize
    const updateBaseY = () => {
        baseY = window.innerHeight * 0.35;
    };
    window.addEventListener('resize', updateBaseY);
    
    // Start animation
    animate();
}

const PLATFORM_SHOWCASE_DATA = [
    {
        id: 'ios',
        name: 'iOS',
        badge: 'SwiftUI · visionOS',
        type: 'phone',
        brand: 'Apple A17 Pro · Secure Enclave',
        highlight: 'HyperLaunch native UI + SOC push pipeline.',
        capabilities: [
            'Face ID & Passkeys valmiina',
            'App Store Connect automaatio',
            'Live Activities · Dynamic Island'
        ],
        code: `struct HyperFluxView: View {
    var body: some View {
        VStack(spacing: 14) {
            Text("AnomFIN HyperFlux")
                .font(.title3.weight(.semibold))
                .foregroundStyle(.mint)
            Label("audit trail: OK", systemImage: "lock.shield")
                .font(.footnote)
                .symbolEffect(.pulse.wholeSymbol)
        }
        .padding(24)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 26, style: .continuous))
    }
}`,
        footer: ['Secure Enclave', 'Face ID login']
    },
    {
        id: 'android',
        name: 'Android',
        badge: 'Jetpack Compose',
        type: 'phone',
        brand: 'Pixel · One UI · Material You',
        highlight: 'Offline-first + GraphQL Edge synkronointi.',
        capabilities: [
            'Play Integrity API',
            'Wear OS kumppanisovellus',
            'PhishHunterAI™ push-hälytykset'
        ],
        code: `@Composable
fun HyperLaunchCard() {
    Column(
        modifier = Modifier
            .padding(24.dp)
            .clip(RoundedCornerShape(26.dp))
            .background(Brush.linearGradient(listOf(Color(0xFF002430), Color(0xFF003a55))))
    ) {
        Text("AnomFIN Android", style = MaterialTheme.typography.titleMedium)
        AssistChip(label = { Text("SOC 24/7") })
        Text("Kyberturva · GraphQL Edge", style = MaterialTheme.typography.bodySmall)
    }
}`,
        footer: ['Kotlin · Compose', 'Material You']
    },
    {
        id: 'macos',
        name: 'macOS',
        badge: 'Swift · Catalyst',
        type: 'desktop',
        brand: 'MacBook Pro · M3 Max',
        highlight: 'Unified binary + notarointi + Endpoint Security.',
        capabilities: [
            'Menu bar -agentti',
            'Shortcuts automaatio',
            'SIEM-loki vienti'
        ],
        code: `import HyperFluxKit
let client = HyperFlux()
client.stream(.securityFeed) { event in
    print("🔐", event.summary)
}
Task {
    try await client.pushComplianceReport()
}`,
        footer: ['Universal binary', 'M3 optimized']
    },
    {
        id: 'windows',
        name: 'Windows',
        badge: 'WinUI 3 · WPF Bridge',
        type: 'desktop',
        brand: 'Surface Studio · Azure AD',
        highlight: 'Zero Trust login + Defender for Endpoint -integraatio.',
        capabilities: [
            'Intune hallinta',
            'PowerShell Desired State',
            'Teams Alerts -kortit'
        ],
        code: `public sealed partial class Dashboard : Window {
    public Dashboard() {
        InitializeComponent();
        Telemetry.Connect("anomfin-hyperflux");
        AzureAd.LoginWithDeviceCode();
    }
}`,
        footer: ['Azure AD login', 'WPF/WinUI bridge']
    },
    {
        id: 'linux',
        name: 'Linux',
        badge: 'GTK · Rust',
        type: 'desktop',
        brand: 'Ubuntu LTS · Hardened Kernel',
        highlight: 'Infra-as-code + SOC agentti + eBPF-telemetria.',
        capabilities: [
            'Systemd palveluvalvonta',
            'Immutable devops pipelines',
            'SELinux/AppArmor profiilit'
        ],
        code: `#!/usr/bin/env python3
from hyperflux import Monitor
monitor = Monitor()
for alert in monitor.stream():
    print(alert.to_cli())
monitor.deploy("anomfin-edge", harden=True)`
,
        footer: ['Ubuntu 22.04 LTS', 'Systemd services']
    },
    {
        id: 'web',
        name: 'Web',
        badge: 'Next.js · Astro',
        type: 'browser',
        brand: 'Vercel Edge · Cloudflare SOC',
        highlight: 'Realtime SSR + Astro Islands + SOC instrumentation.',
        capabilities: [
            'Edge Functions Audit Trail',
            'A/B + Feature Flags',
            'WCAG AA saavutettavuus'
        ],
        code: `export default function Hero() {
  return (
    <section className="hero">
      <h1>AnomFIN HyperLaunch</h1>
      <p>SSR + Edge + SOC ready</p>
    </section>
  );
}`,
        footer: ['TypeScript', 'Vercel Edge']
    }
];


function initPlatformShowcase() {
    const container = document.getElementById('platform-visuals');
    if (!container) return;

    const chipList = document.getElementById('platform-chiplist');
    const chips = chipList ? Array.from(chipList.querySelectorAll('.platform-chip')) : [];

    container.innerHTML = '';

    const stage = document.createElement('div');
    stage.className = 'platform-carousel';
    const orbit = document.createElement('div');
    orbit.className = 'platform-orbit';

    const cards = PLATFORM_SHOWCASE_DATA.map((item) => {
        const card = buildPlatformCard(item);
        orbit.appendChild(card);
        return card;
    });

    if (!cards.length) return;

    stage.appendChild(orbit);
    container.appendChild(stage);

    setupPlatformCarousel(stage, orbit, cards, chips);
}

function buildPlatformCard(item = {}) {
    const id = (item.id || item.name || 'platform').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const card = document.createElement('article');
    card.className = `device-card device-${id}`;
    card.dataset.platform = id;
    card.setAttribute('role', 'group');
    card.setAttribute('aria-roledescription', 'alustademo');
    if (item.name) {
        card.setAttribute('aria-label', item.name);
    }

    const header = document.createElement('header');
    header.className = 'device-header';

    const title = document.createElement('div');
    title.className = 'device-title';

    const name = document.createElement('span');
    name.className = 'device-name';
    name.textContent = item.name || 'Alusta';
    title.appendChild(name);

    if (item.brand) {
        const meta = document.createElement('span');
        meta.className = 'device-meta';
        meta.textContent = item.brand;
        title.appendChild(meta);
    }

    const badge = document.createElement('span');
    badge.className = 'device-badge';
    badge.textContent = item.badge || 'HyperLaunch';

    header.appendChild(title);
    header.appendChild(badge);

    const shellClasses = ['device-shell', `device-shell-${id}`];
    if (item.type === 'phone') shellClasses.push('phone');
    if (item.type === 'browser') shellClasses.push('browser');
    const shell = document.createElement('div');
    shell.className = shellClasses.filter(Boolean).join(' ');

    if (item.type === 'phone') {
        const notch = document.createElement('div');
        notch.className = 'device-notch';
        shell.appendChild(notch);
    } else if (item.type === 'browser') {
        const chrome = document.createElement('div');
        chrome.className = 'device-browser-bar';
        const dots = document.createElement('div');
        dots.className = 'device-browser-dots';
        ['red', 'yellow', 'green'].forEach(color => {
            const dot = document.createElement('span');
            dot.className = `device-browser-dot ${color}`;
            dots.appendChild(dot);
        });
        chrome.appendChild(dots);
        shell.appendChild(chrome);
    } else {
        const statusBar = document.createElement('div');
        statusBar.className = 'device-status-bar';
        statusBar.innerHTML = '<span></span>';
        shell.appendChild(statusBar);
    }

    const screen = document.createElement('div');
    screen.className = 'device-screen';
    const screenInner = document.createElement('div');
    screenInner.className = 'device-screen-inner';

    if (item.highlight) {
        const highlight = document.createElement('p');
        highlight.className = 'device-highlight';
        highlight.textContent = item.highlight;
        screenInner.appendChild(highlight);
    }

    const code = document.createElement('pre');
    code.className = 'device-code';
    code.textContent = item.code || '';
    screenInner.appendChild(code);

    if (Array.isArray(item.capabilities) && item.capabilities.length) {
        const list = document.createElement('ul');
        list.className = 'device-capabilities';
        item.capabilities.forEach(cap => {
            const li = document.createElement('li');
            li.textContent = cap;
            list.appendChild(li);
        });
        screenInner.appendChild(list);
    }

    screen.appendChild(screenInner);
    shell.appendChild(screen);

    const footer = document.createElement('div');
    footer.className = 'device-footer';
    (item.footer || []).forEach(label => {
        const span = document.createElement('span');
        span.textContent = label;
        footer.appendChild(span);
    });

    card.appendChild(header);
    card.appendChild(shell);
    card.appendChild(footer);

    return card;
}

function setupPlatformCarousel(stage, orbit, cards, chips = []) {
    if (!cards.length) return;

    const total = cards.length;
    let activeIndex = 0;
    let timerId = null;

    const angleStep = 360 / total;

    const computeRelative = (index) => {
        let relative = (index - activeIndex) % total;
        if (relative > total / 2) relative -= total;
        if (relative < -total / 2) relative += total;
        return relative;
    };

    const applyLayout = (instant = false) => {
        const radius = Math.min(460, Math.max(320, window.innerWidth * 0.38));
        cards.forEach((card, index) => {
            const relative = computeRelative(index);
            const angle = relative * angleStep;
            const distance = Math.abs(relative);
            const scale = relative === 0 ? 1.08 : Math.max(0.82, 1 - distance * 0.08);
            const opacity = relative === 0 ? 1 : Math.max(0.28, 0.68 - distance * 0.16);
            const shift = relative * 28;

            card.dataset.offset = String(relative);
            card.style.setProperty('--angle', `${angle}deg`);
            card.style.setProperty('--radius', `${radius}px`);
            card.style.setProperty('--scale', scale.toFixed(2));
            card.style.setProperty('--opacity', opacity.toFixed(2));
            card.style.setProperty('--shift', `${shift}px`);
            if (instant) {
                card.style.transitionDuration = '0s';
            } else {
                card.style.transitionDuration = '';
            }
        });

        chips.forEach((chip, index) => {
            const isActive = index === activeIndex;
            chip.classList.toggle('active', isActive);
            if (isActive) {
                chip.setAttribute('aria-current', 'true');
            } else {
                chip.removeAttribute('aria-current');
            }
        });

        stage.dataset.activePlatform = cards[activeIndex]?.dataset.platform || '';
    };

    const restartTimer = () => {
        if (timerId) clearTimeout(timerId);
        timerId = setTimeout(() => {
            rotateTo(activeIndex + 1);
        }, 5200);
    };

    const stopTimer = () => {
        if (timerId) {
            clearTimeout(timerId);
            timerId = null;
        }
    };

    const rotateTo = (index, instant = false) => {
        activeIndex = (index + total) % total;
        applyLayout(instant);
        restartTimer();
    };

    orbit.addEventListener('pointerenter', stopTimer);
    orbit.addEventListener('pointerleave', restartTimer);
    stage.addEventListener('focusin', stopTimer);
    stage.addEventListener('focusout', restartTimer);

    chips.forEach((chip, index) => {
        chip.dataset.platform = cards[index]?.dataset.platform || '';
        chip.tabIndex = 0;
        chip.addEventListener('click', () => rotateTo(index));
        chip.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                rotateTo(index);
            }
        });
    });

    window.addEventListener('resize', () => applyLayout(true));

    applyLayout(true);
    restartTimer();
}

// GitHub Applications Section
const PORTFOLIO_BASE = [
    {
        key: 'hyperlaunch',
        repo: 'anomfin-website',
        title: 'HyperLaunch™ yritysweb + SOC-näkymä',
        category: 'Kyberturva · Web',
        status: 'LIVE',
        summary: 'Rakensimme responsiivisen HyperLaunch-terminaalin: yrityssivusto, 24/7 SOC-dashboard ja myyntiputki samassa paketissa.',
        stats: [
            { label: 'Go-live', value: '6 viikkoa' },
            { label: 'Ylläpito', value: 'SOC 24/7', accent: true },
            { label: 'Paketti', value: '499 € + ylläpito' }
        ],
        tags: ['Astro', 'Next.js', 'AnomTools', 'Kyberturva'],
        link: { label: 'Katso GitHubissa', url: 'https://github.com/AnomFIN/anomfin-website', external: true },
        featured: true
    },
    {
        key: 'jugibot',
        repo: 'jugitube',
        title: 'JugiBot OmniDesk – monikanavainen asiakaspalvelu',
        category: 'AI-asiakaspalvelu',
        status: 'Pilotointi',
        summary: 'OpenAI- ja Azure-integroitu botti, joka hoitaa yhteydenotot WhatsAppista webiin – sisäänrakennettu riskienhallinta ja lokitus.',
        stats: [
            { label: 'Vasteaika', value: '1.6 s' },
            { label: 'Kielituki', value: 'fi · en · sv', accent: true },
            { label: 'Hinnoittelu', value: '499 € + 89 €/kk' }
        ],
        tags: ['TypeScript', 'FastAPI', 'Azure OpenAI', 'LangChain'],
        link: { label: 'Pyydä JugiBot-demo', url: '#contact', external: false }
    },
    {
        key: 'hrk',
        repo: 'hrk',
        title: 'HRK – henkilöstöhallinnon kyberturva-alusta',
        category: 'Sovellus · Kyberturva',
        status: 'Käytössä',
        summary: 'Sähköinen perehdytys, käyttöoikeusvalvonta ja tietovuotovahti yhdessä näkymässä – pilvessä ja on-prem.',
        stats: [
            { label: 'Käyttöönotto', value: '4 viikkoa' },
            { label: 'Audit lokit', value: 'ISO 27001', accent: true },
            { label: 'Projektit', value: 'alk. 999 €' }
        ],
        tags: ['React', 'Node.js', 'PostgreSQL', 'SIEM'],
        link: { label: 'Tutustu HRK-repoon', url: 'https://github.com/AnomFIN/hrk', external: true }
    },
    {
        key: 'lexai',
        repo: 'lexai',
        title: 'LexAI – sopimusjuridiikan tekoäly',
        category: 'AI · Lakipalvelut',
        status: 'Beta',
        summary: 'Analysoi sopimuksia, nostaa riskikohdat ja ehdottaa korjauksia. Rakennettu suomalaiseen lainsäädäntöön.',
        stats: [
            { label: 'Analyysi', value: '< 30 s' },
            { label: 'Integraatiot', value: 'SharePoint · M-Files', accent: true },
            { label: 'Laajennus', value: 'alk. 2 999 €' }
        ],
        tags: ['Next.js', 'Python', 'LangChain', 'Pinecone'],
        link: { label: 'Avaa LexAI', url: 'https://github.com/AnomFIN/lexai', external: true }
    }
];

const GITHUB_REPOS = PORTFOLIO_BASE
    .map(item => item.repo)
    .filter(Boolean)
    .map(repo => `AnomFIN/${repo}`);

function initApplicationsSection() {
    const gallery = document.getElementById('applications-gallery');
    if (!gallery) return;

    const renderFallback = () => renderPortfolioGallery(gallery, PORTFOLIO_BASE);

    fetchGitHubRepos()
        .then(repos => {
            if (Array.isArray(repos) && repos.length) {
                renderPortfolioGallery(gallery, enrichPortfolioWithRepos(repos));
            } else {
                renderFallback();
            }
        })
        .catch(error => {
            console.warn('GitHub API failed, using curated portfolio', error);
            renderFallback();
        });
}

async function fetchGitHubRepos() {
    try {
        const repoPromises = GITHUB_REPOS.map(async (repo) => {
            const response = await fetch(`https://api.github.com/repos/${repo}`, {
                headers: { 'Accept': 'application/vnd.github+json' }
            });
            if (response.ok) {
                return await response.json();
            }
            return null;
        });

        const repos = await Promise.all(repoPromises);
        return repos.filter(Boolean);
    } catch (error) {
        throw error;
    }
}

function enrichPortfolioWithRepos(repos = []) {
    const repoMap = new Map();
    repos.forEach(repo => {
        if (repo?.name) {
            repoMap.set(repo.name.toLowerCase(), repo);
        }
    });

    const curated = PORTFOLIO_BASE.map(item => {
        const repo = item.repo ? repoMap.get(item.repo.toLowerCase()) : null;
        const link = { ...(item.link || {}) };
        const tags = new Set(item.tags || []);
        const stats = (item.stats || []).map(stat => ({ ...stat }));

        if (repo) {
            if (repo.html_url) {
                link.url = repo.html_url;
            }
            if (Array.isArray(repo.topics)) {
                repo.topics.slice(0, 3).forEach(topic => tags.add(topic.replace(/-/g, ' ')));
            }
            if (repo.language) {
                tags.add(repo.language);
            }
            if (typeof repo.stargazers_count === 'number' && repo.stargazers_count > 0) {
                stats.push({ label: 'GitHub ⭐', value: repo.stargazers_count.toString(), accent: true });
            }
        }

        return {
            ...item,
            link,
            tags: Array.from(tags),
            stats
        };
    });

    const curatedRepoNames = new Set(PORTFOLIO_BASE.map(item => (item.repo || '').toLowerCase()).filter(Boolean));
    const extras = repos
        .filter(repo => repo?.name && !curatedRepoNames.has(repo.name.toLowerCase()))
        .map(repo => createRepoPortfolioItem(repo));

    return [...curated, ...extras];
}

function createRepoPortfolioItem(repo) {
    const tags = new Set();
    if (repo.language) {
        tags.add(repo.language);
    }
    if (Array.isArray(repo.topics)) {
        repo.topics.slice(0, 3).forEach(topic => tags.add(topic.replace(/-/g, ' ')));
    }

    const stats = [];
    if (typeof repo.stargazers_count === 'number' && repo.stargazers_count > 0) {
        stats.push({ label: 'GitHub ⭐', value: repo.stargazers_count.toString(), accent: true });
    }
    if (typeof repo.forks_count === 'number' && repo.forks_count > 0) {
        stats.push({ label: 'Forkit', value: repo.forks_count.toString() });
    }

    return {
        key: `repo-${repo.name}`,
        title: repo.name,
        category: 'GitHub · Open Source',
        status: 'Avoin',
        summary: repo.description || 'Tutustu avoimeen projektiin GitHubissa.',
        stats,
        tags: Array.from(tags),
        link: { label: 'Avaa GitHub', url: repo.html_url, external: true }
    };
}

function renderPortfolioGallery(container, items) {
    if (!container) return;

    container.innerHTML = '';

    if (!Array.isArray(items) || !items.length) {
        const empty = document.createElement('div');
        empty.className = 'error-message';
        empty.textContent = 'Portfolio päivitetään parhaillaan – pyydä demo ja katsotaan ratkaisuja yhdessä.';
        container.appendChild(empty);
        return;
    }

    items.forEach((item, index) => {
        container.appendChild(createPortfolioCard(item, index));
    });
}

function createPortfolioCard(item, index) {
    const card = document.createElement('article');
    card.className = 'portfolio-card';
    if (item.featured || index === 0) {
        card.classList.add('featured');
    }

    const head = document.createElement('header');
    head.className = 'portfolio-head';

    const metaRow = document.createElement('div');
    metaRow.className = 'portfolio-meta';

    if (item.category) {
        const category = document.createElement('span');
        category.className = 'meta-pill';
        category.textContent = item.category;
        metaRow.appendChild(category);
    }

    if (item.status) {
        const status = document.createElement('span');
        status.className = 'meta-pill secondary';
        status.textContent = item.status;
        metaRow.appendChild(status);
    }

    head.appendChild(metaRow);

    const title = document.createElement('h3');
    title.className = 'portfolio-title';
    title.textContent = item.title;
    head.appendChild(title);

    card.appendChild(head);

    if (item.summary) {
        const summary = document.createElement('p');
        summary.className = 'portfolio-summary';
        summary.textContent = item.summary;
        card.appendChild(summary);
    }

    if (Array.isArray(item.stats) && item.stats.length) {
        const statsList = document.createElement('ul');
        statsList.className = 'portfolio-stats';
        item.stats.forEach((stat, idx) => {
            const li = document.createElement('li');
            li.className = 'portfolio-stat';
            if (stat.accent || idx % 2 === 1) {
                li.classList.add('accent');
            }

            const label = document.createElement('span');
            label.className = 'stat-label';
            label.textContent = stat.label;

            const value = document.createElement('span');
            value.className = 'stat-value';
            value.textContent = stat.value;

            li.appendChild(label);
            li.appendChild(value);
            statsList.appendChild(li);
        });

        card.appendChild(statsList);
    }

    if (Array.isArray(item.tags) && item.tags.length) {
        const tagsWrap = document.createElement('div');
        tagsWrap.className = 'portfolio-tags';
        item.tags.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = 'portfolio-tag';
            tagEl.textContent = tag;
            tagsWrap.appendChild(tagEl);
        });
        card.appendChild(tagsWrap);
    }

    const link = item.link;
    if (link && link.url) {
        const action = document.createElement('a');
        action.className = 'portfolio-cta';
        action.href = safeUrl(link.url);
        if (link.external) {
            action.setAttribute('target', '_blank');
            action.setAttribute('rel', 'noopener noreferrer');
        }
        action.textContent = link.label || 'Tutustu';
        const arrow = document.createElement('span');
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '→';
        action.appendChild(arrow);
        card.appendChild(action);
    }

    return card;
}

// Mobile Visual Enhancements - Matrix Rain Effect
function initMobileVisualEnhancements() {
    // Only run on mobile devices
    if (window.innerWidth > 800) return;
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    
    // Create matrix rain container
    const matrixRainContainer = document.createElement('div');
    matrixRainContainer.className = 'mobile-matrix-rain';
    
    // Create canvas for matrix effect
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    matrixRainContainer.appendChild(canvas);
    document.body.appendChild(matrixRainContainer);
    
    // Set canvas size
    const setCanvasSize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);
    
    // Matrix characters - AnomFIN project names and keywords
    const chars = 'AnomFIN AnomTools Jugi JugiBot JugiTools Kali Linux Ubuntu v22.04 Teboil 01010110';
    const charArray = chars.split(' ');
    
    // Code snippets to display instead of Chinese characters
    const codeSnippets = [
        'AnomFIN', 'AnomTools', 'Jugi', 'JugiBot', 'JugiTools', 
        'Kali Linux', 'Ubuntu v22.04', 'Teboil',
        '01', '10', '11', '00', 
        '{', '}', '[', ']', '(', ')', 
        '<', '>', '/', '*', '+', '-', '=',
        'def', 'var', 'fn', 'if', 'for'
    ];
    
    const fontSize = 12;
    const columns = Math.floor(canvas.width / fontSize);

    const drops = Array(columns).fill(1);
    
    // Draw matrix rain with code snippets - slower and more subtle
    const drawMatrixRain = () => {
        // More transparent black to create softer fade effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Green text with reduced opacity for subtlety
        ctx.fillStyle = 'rgba(0, 255, 150, 0.4)';
        ctx.font = `${fontSize}px monospace`;
        
        // Draw text
        for (let i = 0; i < drops.length; i++) {

            const text = charArray[Math.floor(Math.random() * charArray.length)];
            const snippet = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
            const x = i * fontSize;
            const y = drops[i] * fontSize;
            
            ctx.fillText(snippet, x, y);
            
            // Reset drop randomly or when it reaches bottom
            if (y > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            
            // Slower drop speed - increment less frequently
            if (Math.random() > 0.5) {
                drops[i]++;
            }
        }
    };
    
    // Enhanced intro overlay for mobile
    const overlay = document.querySelector('.intro-overlay');
    if (overlay) {
        // Add mega logo class for mobile
        overlay.classList.add('mobile-logo-mega');
        
        // Start matrix rain after logo fade
        setTimeout(() => {
            matrixRainContainer.classList.add('active');
            
            // Start matrix animation - slower interval (100ms instead of 50ms)
            let matrixInterval = setInterval(drawMatrixRain, 100);
            
            // Handle visibility changes to save resources
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    clearInterval(matrixInterval);
                } else {
                    matrixInterval = setInterval(drawMatrixRain, 100);
                }
            });
            
            // Fade out overlay after logo animation
            setTimeout(() => {
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 1s ease';
                setTimeout(() => {
                    overlay.classList.add('intro-overlay-hidden');
                }, 1000);
            }, 2000);
        }, 2000);
    }
    
    // Update matrix effect on resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 800) {
            matrixRainContainer.remove();
        }
    });
}

// Mobile HyperCube popup trigger
function initMobileHyperCubeTrigger() {
    if ((document.body?.dataset?.hybercube ?? '1') === '0') {
        return;
    }
    if (window.innerWidth > 800) return;
    
    const trigger = document.getElementById('mobile-hypercube-trigger');
    const companion = document.querySelector('.scroll-companion');
    
    if (!trigger || !companion) return;
    
    let isPopupVisible = false;
    
    trigger.addEventListener('click', () => {
        if (!isPopupVisible) {
            // Show the hypercube
            companion.classList.add('mobile-popup');
            
            // Position it in the center of viewport
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const companionWidth = companion.offsetWidth || 280;
            const companionHeight = companion.offsetHeight || 400;
            
            const x = (viewportWidth - companionWidth) / 2;
            const y = (viewportHeight - companionHeight) / 2;
            
            companion.style.setProperty('--companion-x', `${x}px`);
            companion.style.setProperty('--companion-y', `${y}px`);
            
            trigger.textContent = 'Piilota HyperCube ✕';
            isPopupVisible = true;
            
            // Add click outside to close
            setTimeout(() => {
                document.addEventListener('click', closeOnClickOutside);
            }, 100);
        } else {
            // Hide the hypercube
            companion.classList.remove('mobile-popup');
            trigger.textContent = 'Näytä HyperCube 🎯';
            isPopupVisible = false;
            document.removeEventListener('click', closeOnClickOutside);
        }
    });
    
    function closeOnClickOutside(e) {
        if (isPopupVisible && !companion.contains(e.target) && e.target !== trigger) {
            companion.classList.remove('mobile-popup');
            trigger.textContent = 'Näytä HyperCube 🎯';
            isPopupVisible = false;
            document.removeEventListener('click', closeOnClickOutside);
        }
    }
}

// Mobile GitHub Hypercube Effect - Creative 3D rotating cube
function initMobileHypercube() {
    if ((document.body?.dataset?.hybercube ?? '1') === '0') {
        return;
    }
    // Only run on mobile devices
    if (window.innerWidth > 800) return;
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    
    // Create hypercube container
    const hypercubeContainer = document.createElement('div');
    hypercubeContainer.className = 'mobile-hypercube';
    
    // Create canvas for hypercube
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    hypercubeContainer.appendChild(canvas);
    document.body.appendChild(hypercubeContainer);
    
    // Set canvas size
    const setCanvasSize = () => {
        canvas.width = 200;
        canvas.height = 200;
    };
    setCanvasSize();
    
    // 4D Hypercube vertices (tesseract)
    const vertices4D = [
        [-1, -1, -1, -1], [1, -1, -1, -1], [1, 1, -1, -1], [-1, 1, -1, -1],
        [-1, -1, 1, -1], [1, -1, 1, -1], [1, 1, 1, -1], [-1, 1, 1, -1],
        [-1, -1, -1, 1], [1, -1, -1, 1], [1, 1, -1, 1], [-1, 1, -1, 1],
        [-1, -1, 1, 1], [1, -1, 1, 1], [1, 1, 1, 1], [-1, 1, 1, 1]
    ];
    
    // Edges connecting vertices
    const edges = [
        // Inner cube
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7],
        // Outer cube
        [8, 9], [9, 10], [10, 11], [11, 8],
        [12, 13], [13, 14], [14, 15], [15, 12],
        [8, 12], [9, 13], [10, 14], [11, 15],
        // Connections between cubes
        [0, 8], [1, 9], [2, 10], [3, 11],
        [4, 12], [5, 13], [6, 14], [7, 15]
    ];
    
    let angleXY = 0;
    let angleZW = 0;
    let angleXZ = 0;
    
    // Rotation matrices for 4D
    function rotateXY(vertices, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return vertices.map(v => [
            v[0] * cos - v[1] * sin,
            v[0] * sin + v[1] * cos,
            v[2], v[3]
        ]);
    }
    
    function rotateZW(vertices, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return vertices.map(v => [
            v[0], v[1],
            v[2] * cos - v[3] * sin,
            v[2] * sin + v[3] * cos
        ]);
    }
    
    function rotateXZ(vertices, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return vertices.map(v => [
            v[0] * cos - v[2] * sin,
            v[1],
            v[0] * sin + v[2] * cos,
            v[3]
        ]);
    }
    
    // Project 4D to 3D then to 2D
    function project4Dto2D(vertices) {
        const distance3D = 3;
        const distance2D = 2.5;
        
        // Project 4D to 3D
        const vertices3D = vertices.map(v => {
            const w = 1 / (distance3D - v[3]);
            return [v[0] * w, v[1] * w, v[2] * w];
        });
        
        // Project 3D to 2D
        return vertices3D.map(v => {
            const z = 1 / (distance2D - v[2]);
            return [v[0] * z, v[1] * z];
        });
    }
    
    function drawHypercube() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply rotations
        let rotated = rotateXY(vertices4D, angleXY);
        rotated = rotateZW(rotated, angleZW);
        rotated = rotateXZ(rotated, angleXZ);
        
        // Project to 2D
        const projected = project4Dto2D(rotated);
        
        // Draw edges
        const scale = 40;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        ctx.strokeStyle = 'rgba(0, 255, 166, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(0, 255, 166, 0.8)';
        
        edges.forEach(([i, j]) => {
            ctx.beginPath();
            ctx.moveTo(
                centerX + projected[i][0] * scale,
                centerY + projected[i][1] * scale
            );
            ctx.lineTo(
                centerX + projected[j][0] * scale,
                centerY + projected[j][1] * scale
            );
            ctx.stroke();
        });
        
        // Draw vertices
        ctx.fillStyle = 'rgba(0, 255, 166, 0.9)';
        ctx.shadowBlur = 12;
        projected.forEach(p => {
            ctx.beginPath();
            ctx.arc(centerX + p[0] * scale, centerY + p[1] * scale, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Update rotation angles
        angleXY += 0.008;
        angleZW += 0.005;
        angleXZ += 0.006;
    }
    
    // Start after intro animation
    setTimeout(() => {
        hypercubeContainer.classList.add('active');
        
        let animationId;
        const animate = () => {
            drawHypercube();
            animationId = requestAnimationFrame(animate);
        };
        animate();
        
        // Cleanup on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                cancelAnimationFrame(animationId);
            } else {
                animate();
            }
        });
    }, 3000);
    
    // Cleanup on resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 800) {
            hypercubeContainer.remove();
        }
    });
}

// Mobile Particle Effect - Lightweight floating particles
function initMobileParticles() {
    // Only run on mobile devices
    if (window.innerWidth > 800) return;
    
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    
    // Create particle container
    const particleContainer = document.createElement('div');
    particleContainer.className = 'mobile-particles';
    
    // Create canvas for particles
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    particleContainer.appendChild(canvas);
    document.body.appendChild(particleContainer);
    
    // Set canvas size
    const setCanvasSize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);
    
    // Particle class
    class Particle {
        constructor() {
            this.reset();
        }
        
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.3;
            this.vy = (Math.random() - 0.5) * 0.3;
            this.life = Math.random() * 100 + 100;
            this.maxLife = this.life;
            this.size = Math.random() * 2 + 0.5;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life--;
            
            // Wrap around edges
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            if (this.y > canvas.height) this.y = 0;
            
            if (this.life <= 0) {
                this.reset();
            }
        }
        
        draw() {
            const alpha = this.life / this.maxLife;
            ctx.fillStyle = `rgba(0, 255, 166, ${alpha * 0.4})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add glow
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(0, 255, 166, 0.5)';
        }
    }
    
    // Create particles - keep it lightweight (30 particles)
    const particles = [];
    for (let i = 0; i < 30; i++) {
        particles.push(new Particle());
    }
    
    function drawParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
    }
    
    // Start after intro animation
    setTimeout(() => {
        particleContainer.classList.add('active');
        
        let animationId;
        const animate = () => {
            drawParticles();
            animationId = requestAnimationFrame(animate);
        };
        animate();
        
        // Cleanup on visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                cancelAnimationFrame(animationId);
            } else {
                animate();
            }
        });
    }, 3500);
    
    // Cleanup on resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 800) {
            particleContainer.remove();
        }
    });
}

// Chat Widget Integration
let chatWidgetInstance = null;

function initChatWidget() {
    if (chatWidgetInstance) return;

    if ((document.body?.dataset?.chatDock ?? '1') === '0') {
        return;
    }

    let dock = document.querySelector('.chat-dock');
    if (!dock) {
        dock = document.createElement('div');
        dock.className = 'chat-dock chat-dock-floating';
        dock.id = 'chat-dock';
        dock.setAttribute('aria-live', 'polite');
        document.body.appendChild(dock);
    }

    const chatDefaults = ANOMFIN_DEFAULT_SETTINGS.integrations.chat;
    const chatSettings = {
        ...chatDefaults,
        ...(window.__ANOMFIN_SETTINGS?.integrations?.chat || {})
    };

    dock.innerHTML = '';

    if (!chatSettings.enabled) {
        const disabledNote = document.createElement('p');
        disabledNote.className = 'chat-disabled-note';
        disabledNote.textContent = 'HyperLaunch-chat on pois päältä. Aktivoi se asetuksista, kun API-avain on valmiina.';
        dock.appendChild(disabledNote);
        document.dispatchEvent(new CustomEvent('anomfin:chat-availability', { detail: { available: false } }));
        return;
    }

    const hasApiKey = Boolean(chatSettings.apiKey || chatSettings.hasApiKey);
    const widgetId = `hyperlaunch-chat-${Date.now().toString(36)}`;
    const aiAvatarUrl = safeUrl(chatSettings.avatarUrl || chatDefaults.avatarUrl || 'assets/logotp.png', 'assets/logotp.png');

    const widget = document.createElement('section');
    widget.className = 'chat-widget chat-widget-minimal active';
    if (!hasApiKey) {
        widget.classList.add('chat-widget-offline');
    }

    widget.innerHTML = `
        <div class="chat-widget-shell">
            <header class="chat-widget-header">
                <div class="chat-header-logo">
                    <img src="${escapeHtml(aiAvatarUrl)}" alt="AnomFIN chat-logo" class="chat-header-logo-img">
                </div>
                <div class="chat-header-actions">
                    <button class="chat-widget-expand" type="button" aria-expanded="false" aria-label="Laajenna HyperLaunch-chat" title="Laajenna">
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 3h6v2H7v4H5V3zm14 18h-6v-2h4v-4h2v6zm0-18v6h-2V7h-4V5h6zM5 21v-6h2v4h4v2H5z" fill="currentColor"/></svg>
                    </button>
                    <button class="chat-widget-close" type="button" aria-expanded="true" aria-controls="${widgetId}-messages" aria-label="Piilota HyperLaunch-chat" title="Piilota">
                        <span class="sr-only">Piilota chat</span>
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.4 5l5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4L12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z" fill="currentColor"/></svg>
                    </button>
                </div>
            </header>
            <div class="chat-messages" id="${widgetId}-messages" role="log" aria-live="polite"></div>
            <div class="chat-input-container">
                <form class="chat-input-form" id="${widgetId}-form" novalidate>
                    <label class="sr-only" for="${widgetId}-input">Kirjoita viestisi</label>
                    <div class="chat-input-shell">
                        <input type="text" class="chat-input" id="${widgetId}-input" placeholder="Kirjoita viestisi..." autocomplete="off" required>
                    </div>
                </form>
            </div>
        </div>
    `;

    dock.appendChild(widget);
    chatWidgetInstance = widget;

    const messagesEl = widget.querySelector('.chat-messages');
    const form = widget.querySelector('.chat-input-form');
    const input = widget.querySelector('.chat-input');
    const toggleBtn = widget.querySelector('.chat-widget-close');
    const expandBtn = widget.querySelector('.chat-widget-expand');
    const headerEl = widget.querySelector('.chat-widget-header');

    let isFullscreen = false;
    let fullscreenOverlay = null;
    let lastSpeaker = null;

    const ensureOverlay = () => {
        if (!fullscreenOverlay) {
            fullscreenOverlay = document.createElement('div');
            fullscreenOverlay.className = 'chat-fullscreen-overlay';
            fullscreenOverlay.addEventListener('click', () => setFullscreen(false));
        }
        return fullscreenOverlay;
    };

    function setFullscreen(active) {
        const nextState = Boolean(active);
        if (nextState === isFullscreen) return;
        isFullscreen = nextState;
        widget.classList.toggle('chat-fullscreen', isFullscreen);

        const overlay = ensureOverlay();
        if (isFullscreen) {
            document.body.appendChild(overlay);
            requestAnimationFrame(() => overlay.classList.add('active'));
        } else if (overlay.parentElement) {
            overlay.classList.remove('active');
            overlay.addEventListener('transitionend', () => {
                overlay.remove();
            }, { once: true });
        }

        document.body.classList.toggle('chat-fullscreen-open', isFullscreen);
        document.dispatchEvent(new CustomEvent('anomfin:chat-fullscreen', { detail: { expanded: isFullscreen } }));
    }

    const conversationHistory = [];
    if (chatSettings.systemPrompt) {
        conversationHistory.push({ role: 'system', content: chatSettings.systemPrompt });
    }

    function setExpanded(expanded) {
        const isExpanded = Boolean(expanded);
        widget.classList.toggle('chat-collapsed', !isExpanded);
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
            toggleBtn.setAttribute('aria-label', isExpanded ? 'Piilota HyperLaunch-chat' : 'Avaa HyperLaunch-chat');
            toggleBtn.setAttribute('title', isExpanded ? 'Piilota' : 'Avaa');
        }
        if (!isExpanded && isFullscreen) {
            setFullscreen(false);
        }
        if (isExpanded && input && !input.disabled) {
            requestAnimationFrame(() => input.focus());
        }
        document.dispatchEvent(new CustomEvent('anomfin:chat-expanded', { detail: { expanded: isExpanded } }));
    }

    window.__anomfinChatSetExpanded = setExpanded;

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
            setExpanded(!expanded);
        });
    }

    if (expandBtn) {
        expandBtn.addEventListener('click', () => {
            setFullscreen(!isFullscreen);
        });
    }

    function createAvatar(isUser, ghost = false) {
        const avatar = document.createElement('div');
        avatar.className = `chat-message-avatar ${isUser ? 'chat-message-avatar-user' : 'chat-message-avatar-ai'}`;
        avatar.setAttribute('aria-hidden', 'true');
        if (ghost) {
            avatar.classList.add('chat-message-avatar-ghost');
            return avatar;
        }
        if (isUser) {
            const dot = document.createElement('span');
            dot.className = 'chat-avatar-user-dot';
            avatar.appendChild(dot);
        } else {
            const img = document.createElement('img');
            img.src = aiAvatarUrl;
            img.alt = '';
            img.setAttribute('aria-hidden', 'true');
            avatar.appendChild(img);
        }
        return avatar;
    }

    function updateHeaderDepth() {
        if (!headerEl) return;
        const count = messagesEl.querySelectorAll('.chat-message:not(.typing-indicator)').length;
        headerEl.classList.toggle('chat-header-muted', count >= 6);
    }

    function addMessage(content, isUser = false, pushToHistory = true) {
        const safeContent = String(content || '').trim();
        if (!safeContent) return;

        const speaker = isUser ? 'user' : 'ai';
        const sameSpeaker = lastSpeaker === speaker;
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${speaker}`;

        const avatar = createAvatar(isUser, sameSpeaker);
        messageDiv.appendChild(avatar);

        const body = document.createElement('div');
        body.className = 'chat-message-content';
        body.innerHTML = safeContent
            .split(/\n+/)
            .map(line => `<p>${escapeHtml(line)}</p>`)
            .join('');
        messageDiv.appendChild(body);

        messagesEl.appendChild(messageDiv);
        messagesEl.scrollTop = messagesEl.scrollHeight;

        lastSpeaker = speaker;
        updateHeaderDepth();

        if (pushToHistory) {
            conversationHistory.push({ role: isUser ? 'user' : 'assistant', content: safeContent });
        }

        return messageDiv;
    }

    function showTypingIndicator() {
        const sameSpeaker = lastSpeaker === 'ai';
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message typing-indicator ai';
        typingDiv.appendChild(createAvatar(false, sameSpeaker));

        const content = document.createElement('div');
        content.className = 'chat-message-content chat-message-content-typing';
        content.innerHTML = `
            <div class="chat-typing-indicator">
                <span class="chat-typing-text">...</span>
                <div class="chat-typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        typingDiv.appendChild(content);

        messagesEl.appendChild(typingDiv);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return typingDiv;
    }

    function trimHistory() {
        const limit = 8;
        if (conversationHistory.length > limit) {
            const systemMessages = conversationHistory.filter(entry => entry.role === 'system');
            const dialogue = conversationHistory.filter(entry => entry.role !== 'system');
            const trimmedDialogue = dialogue.slice(-limit);
            conversationHistory.length = 0;
            conversationHistory.push(...systemMessages, ...trimmedDialogue);
        }
        return conversationHistory.filter(entry => entry.role !== 'system');
    }

    async function requestChatCompletion(message) {
        const payload = {
            message,
            history: trimHistory(),
            systemPrompt: chatSettings.systemPrompt || '',
            model: chatSettings.model || chatDefaults.model,
            temperature: typeof chatSettings.temperature === 'number'
                ? chatSettings.temperature
                : chatDefaults.temperature
        };

        const endpoint = chatSettings.endpoint || chatDefaults.endpoint;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Chat endpoint returned ${response.status}`);
        }

        const data = await response.json();
        if (!data || !data.success || !data.reply) {
            throw new Error(data?.error || 'Chatbot ei vastannut');
        }

        return String(data.reply);
    }

    function runGreetingSequence() {
        const sequence = [];
        if (chatSettings.greeting) {
            sequence.push({ delay: 5000, text: chatSettings.greeting });
        }
        if (chatSettings.followup) {
            sequence.push({ delay: 2000, text: chatSettings.followup });
        }
        if (!sequence.length) return;

        let chain = Promise.resolve();
        sequence.forEach((step) => {
            chain = chain.then(() => new Promise((resolve) => {
                const indicator = showTypingIndicator();
                setTimeout(() => {
                    indicator.remove();
                    addMessage(step.text, false, true);
                    resolve();
                }, step.delay);
            }));
        });
    }

    setExpanded(true);
    document.dispatchEvent(new CustomEvent('anomfin:chat-ready', { detail: { expanded: true } }));
    document.dispatchEvent(new CustomEvent('anomfin:chat-availability', { detail: { available: hasApiKey } }));

    if (!hasApiKey) {
        if (input) {
            input.disabled = true;
            input.placeholder = 'Aktivoi chat asetuksista';
        }
        addMessage('Syötä OpenAI API -avain asetuksista niin aktivoimme chatin välittömästi.', false, false);
        return;
    }

    setTimeout(runGreetingSequence, 600);

    if (form && input) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const message = input.value.trim();
            if (!message || input.disabled) {
                return;
            }

            addMessage(message, true, true);
            input.value = '';

            const typingIndicator = showTypingIndicator();
            input.disabled = true;

            try {
                const reply = await requestChatCompletion(message);
                typingIndicator.remove();
                addMessage(reply, false, true);
            } catch (error) {
                console.error('Chat error:', error);
                typingIndicator.remove();
                addMessage('Jokin meni vikaan – voit aina lähettää viestiä osoitteeseen info@anomfin.fi.', false, false);
            } finally {
                input.disabled = false;
                input.focus();
            }
        });
    }
}
