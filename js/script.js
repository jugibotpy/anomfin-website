// Mobile Navigation Toggle & Smooth Scroll Enhancements
document.addEventListener('DOMContentLoaded', () => {
    applyUserSettingsFromStorage();
    const mobileMenu = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');

    initIntroOverlay();

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

// Navbar Background on Scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(6, 7, 10, 0.95)';
    } else {
        navbar.style.background = 'rgba(6, 7, 10, 0.8)';
    }
});

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
      const vh = window.innerHeight;
      // follow at ~22% viewport + parallax factor
      targetY = sy * 0.12 + vh * 0.22;
      // gentle sway left/right by scroll
      targetX = Math.sin(sy * 0.002) * 40 + (window.innerWidth * 0.25);
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
