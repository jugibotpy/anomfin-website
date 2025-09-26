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
