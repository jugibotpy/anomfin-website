// Mobile Navigation Toggle & Smooth Scroll Enhancements
let navbarRef = null;
let navLogoRef = null;

document.addEventListener('DOMContentLoaded', () => {
    applyUserSettingsFromStorage();
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');

    navbarRef = document.querySelector('.navbar');
    navLogoRef = document.querySelector('.nav-logo');

    initIntroOverlay();
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

    // Scroll companion
    initScrollCompanion();

    // Applications section
    initApplicationsSection();

    updateNavbarChrome();
});

function applyUserSettingsFromStorage(){
    try{
        const raw = localStorage.getItem('anomfin:cssVars');
        if(!raw) return;
        const vars = JSON.parse(raw);
        const root = document.documentElement;
        Object.entries(vars).forEach(([k,v])=>{
            if(k && v!=null) root.style.setProperty(k, v);
        });
    }catch(e){/* ignore */}
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
            showNotification('Täytä yritys-, nimi- ja sähköpostikentät.', 'error');
            formStatus.textContent = 'Täytä pakolliset kentät.';
            return;
        }

        if (!isValidEmail(email)) {
            showNotification('Tarkista sähköpostiosoite.', 'error');
            formStatus.textContent = 'Virheellinen sähköpostiosoite.';
            return;
        }

        if (!consentChecked) {
            showNotification('Hyväksy tietosuoja, jotta voimme olla yhteydessä.', 'error');
            formStatus.textContent = 'Hyväksy tietosuojaseloste.';
            return;
        }

        contactForm.reset();
        formStatus.textContent = 'Kiitos! Otamme yhteyttä 24 tunnin sisällä.';
        showNotification('Kiitos viestistä – AnomFIN | AnomTools palaa pian asiaan.', 'success');
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
            const anim = logo.animate([
                { transform: 'translate(0px,0px) scale(1)' },
                { transform: `translate(${midX}px, ${midY}px) scale(${Math.max(1, scale*0.9)})` },
                { transform: `translate(${dx}px, ${dy}px) scale(${scale})` }
            ], { duration: moveMs, easing: (localStorage.getItem('anomfin:ease')||'cubic-bezier(.2,.8,.2,1)'), fill: 'forwards' });

            const onMoveEnd = () => {
                // Neliö reagoi: tärisee, kasvaa ~20% ja vaihtaa vihreäksi
                const fg = document.querySelector('.floating-grid');
                if (fg) {
                    fg.classList.add('fg-super');
                    window.AnomFIN_FG && window.AnomFIN_FG.supercharge && window.AnomFIN_FG.supercharge();
                }
                if (grid) {
                    grid.classList.add('square-excite', 'square-green');
                    const onShakeEnd = () => {
                        grid.classList.remove('square-excite');
                        grid.classList.add('lively');
                        grid.removeEventListener('animationend', onShakeEnd);
                    };
                    grid.addEventListener('animationend', onShakeEnd);
                }
                orb && orb.classList.add('lively');
                // Piilota intro overlay pehmeästi
                setTimeout(() => {
                    overlay.style.opacity = '0';
                    overlay.style.transition = 'opacity .6s ease';
                    setTimeout(() => overlay.classList.add('intro-overlay-hidden'), 700);
                }, 300);
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
        <div class="companion-logo">
            <span class="companion-logo-main">AnomFIN</span>
            <span class="companion-logo-sub">24/7 CHAT</span>
        </div>
        <span class="companion-spark">Scroll Sync</span>
    `;
    
    const quoteContent = isMobile ? 
        'Avoin lähdekoodi, vahva yhteisö. AnomFIN, AnomTools, Jugi-ekosysteemi – Kali Linux ja Ubuntu v22.04 tukevat kehitystyötä.' : 
        'Vieritysmatriisi näyttää missä kohtaa kyberturva- ja sovelluspolkua kuljet.';
    
    companion.innerHTML = `
        <div class="companion-core">
            <div class="companion-header">
                ${headerContent}
            </div>
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
        </div>
    `;

    document.body.appendChild(companion);

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
            const sway = Math.sin((window.scrollY || 0) * 0.004) * 22;
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
      targetX = (vw * (0.15 + 0.7 * p)) + Math.sin(sy * 0.004) * 30 - (vw * 0.5);
      
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
    try{
      const reactHover = (localStorage.getItem('anomfin:reactHover')||'1')==='1';
      if(reactHover){
        document.querySelectorAll('.service-card').forEach(card=>{
          card.addEventListener('mouseenter', ()=>{ scaleTarget = 1.15; });
          card.addEventListener('mouseleave', ()=>{ scaleTarget = 1; });
        });
      }
    }catch(_){}
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
    const logo = document.querySelector('.nav-logo img');
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

    // Add logo blending class first
    rectangle.classList.add('logo-entering');
    
    // After logo blends in, activate terminal and start matrix animation
    setTimeout(() => {
        rectangle.classList.remove('logo-entering');
        rectangle.classList.add('logo-blended', 'rectangle-activated');
        
        // Trigger matrix animation after logo is blended
        setTimeout(() => {
            launchMatrixAnimation(rectangle);
        }, 300);
    }, 1000); // Wait for logo blend animation to complete
}

function launchMatrixAnimation(fromElement) {
    if (matrixAnimationActive) return;
    matrixAnimationActive = true;

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
        z-index: 1000;
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

// Make functions globally accessible for testing
window.launchMatrixAnimation = launchMatrixAnimation;
window.activateRectangle = activateRectangle;

// Add developer test button (only in development)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const testButton = document.createElement('button');
    testButton.textContent = '🎆 Test Matrix Animation';
    testButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 9999;
        padding: 8px 12px;
        background: #00ffa6;
        color: #000;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-size: 12px;
    `;
    testButton.onclick = () => {
        const rectangle = document.querySelector('.hero-grid');
        if (rectangle) {
            launchMatrixAnimation(rectangle);
        }
    };
    document.body.appendChild(testButton);
}

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
    
    // Matrix characters
    const chars = 'ANOMFIN01011010CYBER01101HYPERFLUX010101'.split('');
    const fontSize = 12;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);
    
    const drawMatrix = () => {
        // Semi-transparent black to create fade effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
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
            if (y > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
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

// GitHub Applications Section
const GITHUB_REPOS = [
    'AnomFIN/anomfin-website',
    'AnomFIN/hrk',
    'AnomFIN/jugitube',
    'AnomFIN/iPeili',
    'AnomFIN/lexai'
];

function initApplicationsSection() {
    const applicationsGrid = document.getElementById('applications-grid');
    if (!applicationsGrid) return;

    // Fallback data in case GitHub API fails
    const fallbackData = {
        'AnomFIN/anomfin-website': {
            name: 'anomfin-website',
            description: 'AnomFIN yrityswebsite - modernit sovellus- ja kyberturvaratkaisut',
            html_url: 'https://github.com/AnomFIN/anomfin-website',
            language: 'HTML',
            topics: ['website', 'cybersecurity', 'applications']
        },
        'AnomFIN/hrk': {
            name: 'hrk',
            description: 'HRK - Human Resource Kit: henkilöstöhallinnon työkalupakki',
            html_url: 'https://github.com/AnomFIN/hrk',
            language: 'JavaScript',
            topics: ['hr', 'management', 'tools']
        },
        'AnomFIN/jugitube': {
            name: 'jugitube',
            description: 'JugiTube - Suomalainen videoalusta ja sisällönhallintajärjestelmä',
            html_url: 'https://github.com/AnomFIN/jugitube',
            language: 'TypeScript',
            topics: ['video', 'streaming', 'cms']
        },
        'AnomFIN/iPeili': {
            name: 'iPeili',
            description: 'iPeili - Älykäs peilisovellus IoT-laitteille',
            html_url: 'https://github.com/AnomFIN/iPeili',
            language: 'Python',
            topics: ['iot', 'smart-mirror', 'python']
        },
        'AnomFIN/lexai': {
            name: 'lexai',
            description: 'LexAI - Tekoälyavusteinen lakitekstien analysointityökalu',
            html_url: 'https://github.com/AnomFIN/lexai',
            language: 'Python',
            topics: ['ai', 'legal', 'nlp']
        }
    };

    // Try to fetch from GitHub API first, fall back to static data
    fetchGitHubRepos()
        .then(repos => {
            if (repos && repos.length > 0) {
                displayApplications(repos);
            } else {
                // Use fallback data
                const fallbackRepos = GITHUB_REPOS.map(repo => fallbackData[repo]).filter(Boolean);
                displayApplications(fallbackRepos);
            }
        })
        .catch(error => {
            console.warn('GitHub API failed, using fallback data:', error);
            const fallbackRepos = GITHUB_REPOS.map(repo => fallbackData[repo]).filter(Boolean);
            displayApplications(fallbackRepos);
        });
}

async function fetchGitHubRepos() {
    try {
        const repoPromises = GITHUB_REPOS.map(async (repo) => {
            const response = await fetch(`https://api.github.com/repos/${repo}`);
            if (response.ok) {
                return await response.json();
            }
            return null;
        });

        const repos = await Promise.all(repoPromises);
        return repos.filter(repo => repo !== null);
    } catch (error) {
        throw error;
    }
}

function displayApplications(repos) {
    const applicationsGrid = document.getElementById('applications-grid');
    if (!applicationsGrid) return;

    // Clear loading placeholder
    applicationsGrid.innerHTML = '';

    repos.forEach(repo => {
        const card = createApplicationCard(repo);
        applicationsGrid.appendChild(card);
    });
}

function createApplicationCard(repo) {
    const card = document.createElement('article');
    card.className = 'application-card';

    const icon = getRepoIcon(repo.language || 'Code');
    const techTags = (repo.topics || []).slice(0, 3).map(topic => 
        `<span class="tech-tag">${topic}</span>`
    ).join('');

    card.innerHTML = `
        <div class="application-header">
            <div class="application-icon">${icon}</div>
            <h3 class="application-title">${repo.name}</h3>
        </div>
        <p class="application-description">
            ${repo.description || 'Ei kuvausta saatavilla.'}
        </p>
        <div class="application-tech">
            ${repo.language ? `<span class="tech-tag">${repo.language}</span>` : ''}
            ${techTags}
        </div>
        <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="application-link">
            Katso GitHubissa
        </a>
    `;

    return card;
}

function getRepoIcon(language) {
    const icons = {
        'HTML': '🌐',
        'JavaScript': '⚡',
        'TypeScript': '🔷',
        'Python': '🐍',
        'Java': '☕',
        'C++': '⚙️',
        'CSS': '🎨',
        'Go': '🚀',
        'Rust': '🦀',
        'default': '💾'
    };
    
    return icons[language] || icons.default;
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
function initChatWidget() {
    // Create chat widget HTML structure
    const chatWidget = document.createElement('div');
    chatWidget.className = 'chat-widget';
    chatWidget.innerHTML = `
        <div class="chat-widget-header">
            <div class="chat-widget-title">
                <span class="status-indicator"></span>
                <span>24/7 AnomFIN Chat</span>
            </div>
            <button class="chat-widget-close" aria-label="Close chat">&times;</button>
        </div>
        <div class="chat-messages" id="chat-messages">
            <div class="chat-message">
                <div class="chat-message-avatar">🤖</div>
                <div class="chat-message-content">
                    <p>Tervetuloa AnomFIN-chattiin! Olen täällä auttamassa sinua palveluidemme kanssa.</p>
                    <p>Voin vastata kysymyksiin sovelluskehityksestä, kyberturvasta ja hinnoittelusta. Miten voin auttaa?</p>
                </div>
            </div>
        </div>
        <div class="chat-input-container">
            <form class="chat-input-form" id="chat-form">
                <input type="text" class="chat-input" id="chat-input" placeholder="Kirjoita viestisi..." autocomplete="off">
                <button type="submit" class="chat-send-btn" id="chat-send">Lähetä</button>
            </form>
        </div>
    `;
    
    // Create chat toggle button
    const chatToggleBtn = document.createElement('button');
    chatToggleBtn.className = 'chat-toggle-btn';
    chatToggleBtn.innerHTML = '💬';
    chatToggleBtn.setAttribute('aria-label', 'Open chat');
    
    document.body.appendChild(chatWidget);
    document.body.appendChild(chatToggleBtn);
    
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send');
    const closeBtn = chatWidget.querySelector('.chat-widget-close');
    
    let conversationHistory = [];
    
    // Toggle chat widget
    function toggleChat(show) {
        if (show) {
            chatWidget.classList.add('active');
            chatToggleBtn.classList.add('hidden');
            chatInput.focus();
        } else {
            chatWidget.classList.remove('active');
            chatToggleBtn.classList.remove('hidden');
        }
    }
    
    chatToggleBtn.addEventListener('click', () => toggleChat(true));
    closeBtn.addEventListener('click', () => toggleChat(false));
    
    // Make scroll companion clickable to open chat
    setTimeout(() => {
        const scrollCompanion = document.querySelector('.scroll-companion');
        if (scrollCompanion) {
            scrollCompanion.style.cursor = 'pointer';
            scrollCompanion.addEventListener('click', () => toggleChat(true));
            
            // Add tooltip
            const tooltip = document.createElement('div');
            tooltip.style.cssText = `
                position: absolute;
                top: -40px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 255, 166, 0.9);
                color: #000;
                padding: 0.5rem 1rem;
                border-radius: 8px;
                font-size: 0.8rem;
                font-weight: 600;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
            `;
            tooltip.textContent = 'Klikkaa avataksesi chat';
            scrollCompanion.appendChild(tooltip);
            
            scrollCompanion.addEventListener('mouseenter', () => {
                tooltip.style.opacity = '1';
            });
            
            scrollCompanion.addEventListener('mouseleave', () => {
                tooltip.style.opacity = '0';
            });
        }
    }, 2000);
    
    // Add user message to chat
    function addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isUser ? 'user' : ''}`;
        messageDiv.innerHTML = `
            <div class="chat-message-avatar">${isUser ? '👤' : '🤖'}</div>
            <div class="chat-message-content">
                <p>${content}</p>
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message typing-indicator';
        typingDiv.innerHTML = `
            <div class="chat-message-avatar">🤖</div>
            <div class="chat-message-content">
                <div class="chat-typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return typingDiv;
    }
    
    // Send message to ChatGPT API
    async function sendMessageToAPI(message) {
        // Add user message to history
        conversationHistory.push({
            role: 'user',
            content: message
        });
        
        try {
            // NOTE: In production, this should be a backend endpoint that handles the API key securely
            // For now, this is a placeholder that simulates the ChatGPT response
            const response = await simulateChatGPTResponse(message);
            
            // Add assistant response to history
            conversationHistory.push({
                role: 'assistant',
                content: response
            });
            
            return response;
        } catch (error) {
            console.error('Chat API Error:', error);
            return 'Pahoittelen, mutta en voi vastata juuri nyt. Ota yhteyttä suoraan: info@anomfin.fi';
        }
    }
    
    // Simulate ChatGPT response (replace with actual API call in production)
    async function simulateChatGPTResponse(message) {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('hinta') || lowerMessage.includes('kustann') || lowerMessage.includes('maksa')) {
            return 'AnomFIN tarjoaa kolme pääpakettia:\n\n' +
                   '• Start (690€/kk): Alkuauditointi, peruskovennus ja koulutus\n' +
                   '• Protect (1490€/kk): Start + 24/7 valvonta ja kuukausiraportit\n' +
                   '• Elite (3490€/kk): Protect + 1h SLA ja laajennettu automaatio\n\n' +
                   'Räätälöidyt sovellusprojektit hinnoitellaan erikseen. Haluatko kuulla lisää?';
        } else if (lowerMessage.includes('kyberturva') || lowerMessage.includes('turva') || lowerMessage.includes('security')) {
            return 'AnomFIN tarjoaa kattavat kyberturvaratkaisut:\n\n' +
                   '• PhishHunterAI™ - huijausviestien tunnistus\n' +
                   '• SMS Shield™ - tekstiviestihuijausten torjunta\n' +
                   '• M365/Google kovennukset\n' +
                   '• Incident-apuri ja 24/7 valvonta\n\n' +
                   'Rakennamme PoC:n viikoissa ja viemme tuotantoon turvallisesti. Kiinnostaako demo?';
        } else if (lowerMessage.includes('sovellus') || lowerMessage.includes('kehitys') || lowerMessage.includes('app')) {
            return 'Kehitämme yksilöllisiä sovelluksia kaikille alustoille:\n\n' +
                   '• Mobiilisovellukset (iOS & Android)\n' +
                   '• Desktop-sovellukset (macOS, Windows, Linux)\n' +
                   '• Web-sovellukset\n\n' +
                   'Kyberturva on sisäänrakennettuna jokaisessa ratkaisussa. Toimitamme pienen toimivan version nopeasti ja kasvatamme tarpeen mukaan. Kerro lisää projektistasi?';
        } else if (lowerMessage.includes('yhtey') || lowerMessage.includes('contact') || lowerMessage.includes('varaa')) {
            return 'Otetaan yhteyttä! Voit:\n\n' +
                   '• Varata 30 min kartoitus: info@anomfin.fi\n' +
                   '• Soittaa: +358 40 123 4567\n' +
                   '• Täyttää lomake verkkosivun Contact-osiossa\n\n' +
                   'Vastaamme nopeasti ja sovitaan tapaaminen sinulle sopivaan aikaan.';
        } else if (lowerMessage.includes('demo') || lowerMessage.includes('esittely') || lowerMessage.includes('poc')) {
            return 'Erinomaista! Demossa näytämme:\n\n' +
                   '• Miten ratkaisumme toimii käytännössä\n' +
                   '• Integraatiomahdollisuudet\n' +
                   '• PoC-toteutus viikoissa\n\n' +
                   'Lähetä viesti osoitteeseen info@anomfin.fi tai täytä yhteydenottolomake niin sovitaan demo!';
        } else {
            return 'Kiitos viestistäsi! AnomFIN tarjoaa:\n\n' +
                   '• Yksilöllisiä sovelluksia (mobile, desktop, web)\n' +
                   '• Kyberturvaratkaisut ja 24/7 valvonta\n' +
                   '• Auditoinnit ja penetraatiotestaus\n\n' +
                   'Kysy minulta hinnoittelusta, palveluista tai varaa kartoitus. Miten voin auttaa?';
        }
    }
    
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const message = chatInput.value.trim();
        if (!message) return;
        
        addMessage(message, true);
        chatInput.value = '';
        
        chatInput.disabled = true;
        chatSendBtn.disabled = true;
        
        // Show typing indicator
        const typingIndicator = showTypingIndicator();
        const response = await sendMessageToAPI(message);

        typingIndicator.remove();

        addMessage(response, false);

        chatInput.disabled = false;
        chatSendBtn.disabled = false;
        chatInput.focus();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit before initializing chat to not interfere with other animations
    setTimeout(initChatWidget, 2000);
});