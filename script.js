// Mobile nav + fake form submit (demo only)
const navBtn = document.querySelector('.nav-toggle');
const nav = document.getElementById('primary-nav');
if (navBtn) {
  navBtn.addEventListener('click', () => {
    const expanded = navBtn.getAttribute('aria-expanded') === 'true' || false;
    navBtn.setAttribute('aria-expanded', !expanded);
    nav.classList.toggle('open');
  });
}

function fakeSubmit(e){
  e.preventDefault();
  const status = document.getElementById('form-status');
  status.textContent = "Kiitos! Otamme sinuun yhteyttä pian.";
  e.target.reset();
  return false;
}

// Simple open state styles
const style = document.createElement('style');
style.textContent = `
  .site-nav.open{display:flex;flex-direction:column;position:absolute;right:5vw;top:64px;background:#0e1117;border:1px solid #1b2030;border-radius:12px;padding:.6rem;gap:.2rem;box-shadow:0 10px 30px rgba(0,0,0,.45)}
  .site-nav.open a{padding:.6rem .8rem}
`;
document.head.appendChild(style);

// AnomFIN × AnomTools data hydration
async function hydrateSite() {
  const sourceEl = document.querySelector('main[data-source]');
  const dataUrl = sourceEl?.dataset.source;
  if (!dataUrl) return;

  try {
    const res = await fetch(dataUrl, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const site = await res.json();
    updateHero(site.hero);
    updateServices(site.services);
    updatePlatforms(site.platforms);
    updatePricing(site.pricing);
    updateFaq(site.faq);
  } catch (error) {
    console.warn('AnomFIN × AnomTools hydration epäonnistui', error);
  }
}

function updateHero(hero) {
  if (!hero) return;
  const titleEl = document.querySelector('[data-bind="hero-title"]');
  const subEl = document.querySelector('[data-bind="hero-sub"]');
  const ctaWrapper = document.querySelector('[data-bind="hero-ctas"]');
  if (titleEl) titleEl.textContent = hero.h1 ?? titleEl.textContent;
  if (subEl && hero.sub) subEl.textContent = hero.sub;
  if (ctaWrapper && Array.isArray(hero.ctas)) {
    ctaWrapper.innerHTML = '';
    hero.ctas.forEach((cta, idx) => {
      const link = document.createElement('a');
      link.href = cta.href ?? '#';
      link.textContent = cta.label ?? '';
      link.className = `btn ${idx === 0 ? 'primary' : 'ghost'}`;
      link.rel = cta.rel ?? 'noopener';
      if (cta.target) link.target = cta.target;
      ctaWrapper.appendChild(link);
    });
  }
}

function updateServices(services) {
  const listEl = document.querySelector('[data-bind="services-list"]');
  if (!listEl || !Array.isArray(services)) return;
  listEl.innerHTML = '';
  services.forEach((service) => {
    const card = document.createElement('article');
    card.className = 'card';
    const title = document.createElement('h3');
    title.textContent = service.title ?? '';
    const desc = document.createElement('p');
    desc.textContent = service.desc ?? '';
    card.append(title, desc);
    listEl.appendChild(card);
  });
}

function updatePlatforms(platforms) {
  const listEl = document.querySelector('[data-bind="platforms-list"]');
  if (!listEl || !Array.isArray(platforms)) return;
  listEl.innerHTML = '';
  platforms.forEach((platform) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'platform';
    const label = document.createElement('span');
    label.textContent = platform;
    wrapper.appendChild(label);
    listEl.appendChild(wrapper);
  });
}

function updatePricing(plans) {
  const listEl = document.querySelector('[data-bind="pricing-list"]');
  if (!listEl || !Array.isArray(plans)) return;
  listEl.innerHTML = '';
  plans.forEach((plan, index) => {
    const card = document.createElement('div');
    card.className = 'price-card';
    if (index === 1) {
      card.classList.add('highlight');
    }
    const title = document.createElement('h3');
    title.textContent = plan.name ?? '';
    const price = document.createElement('p');
    price.className = 'price';
    price.textContent = plan.price ?? '';
    const list = document.createElement('ul');
    if (plan.sla) {
      const slaItem = document.createElement('li');
      const strong = document.createElement('b');
      strong.textContent = 'SLA:';
      slaItem.append(strong, document.createTextNode(` ${plan.sla}`));
      list.appendChild(slaItem);
    }
    (plan.features ?? []).forEach((feature) => {
      const li = document.createElement('li');
      li.textContent = feature;
      list.appendChild(li);
    });
    card.append(title, price, list);
    listEl.appendChild(card);
  });
}

function updateFaq(items) {
  const listEl = document.querySelector('[data-bind="faq-list"]');
  if (!listEl || !Array.isArray(items)) return;
  listEl.innerHTML = '';
  items.forEach((item) => {
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = item.q ?? '';
    const body = document.createElement('p');
    body.textContent = item.a ?? '';
    details.append(summary, body);
    listEl.appendChild(details);
  });
}

hydrateSite();
