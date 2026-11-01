/* Accessibilità della navigazione mobile - Audit Develop-lab, 31 ottobre 2026. */
(() => {
  'use strict';
  const header = document.querySelector('.site-header');
  const nav = header?.querySelector('.nav');
  const links = nav?.querySelector('.nav-links');
  if (!header || !nav || !links || nav.querySelector('.site-mobile-menu-toggle')) return;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'site-mobile-menu-toggle';
  toggle.textContent = '☰ Menu';
  toggle.setAttribute('aria-label', 'Apri il menu di navigazione');
  toggle.setAttribute('aria-expanded', 'false');
  if (!links.id) links.id = 'site-main-navigation-links';
  toggle.setAttribute('aria-controls', links.id);
  nav.insertBefore(toggle, links);
  header.classList.add('mobile-nav-ready');

  const close = () => {
    links.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Apri il menu di navigazione');
    toggle.textContent = '☰ Menu';
  };
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Chiudi il menu di navigazione' : 'Apri il menu di navigazione');
    toggle.textContent = open ? '✕ Chiudi' : '☰ Menu';
  });
  links.addEventListener('click', event => {
    if (event.target.closest('a')) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && links.classList.contains('is-open')) {
      close();
      toggle.focus();
    }
  });
  const desktop = window.matchMedia('(min-width: 901px)');
  if (desktop.addEventListener) desktop.addEventListener('change', event => { if (event.matches) close(); });
})();
