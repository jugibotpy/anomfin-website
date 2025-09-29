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

    const companion = document.createElement('aside');
    companion.className = 'scroll-companion';
    companion.setAttribute('aria-label', 'AnomFIN | AnomTools vierityshyperkuutio');
    companion.innerHTML = `
        <div class="companion-core">
            <div class="companion-header">
                <div class="companion-logo">
                    <span class="companion-logo-main">AnomFIN</span>
                    <span class="companion-logo-sub">AnomTools HyperCube</span>
                </div>
                <span class="companion-spark">Scroll Sync</span>
            </div>
            <p class="companion-quote">Vieritysmatriisi näyttää missä kohtaa kyberturva- ja sovelluspolkua kuljet.</p>
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
        security: 'Kyberturva',
        pricing: 'Hinnoittelu',
        contact: 'Yhteys'
    };

    const sparkMap = {
        home: 'HyperLaunch',
        services: 'Build Sprint',
        platforms: 'Omni Deploy',
        security: 'SOC Hyperwatch',
        pricing: 'Selkeä hinnoittelu',
        contact: 'Yhteys valmis'
    };

    const quoteMap = {
        home: 'Vieritysmatriisi näyttää missä kohtaa kyberturva- ja sovelluspolkua kuljet.',
        services: 'Sprinttaa MVP tuotantoon – AnomTools valvoo laatua ja turvaa.',
        platforms: 'Julkaisemme yhdellä koodipohjalla kaikkiin päätelaitteisiin.',
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
