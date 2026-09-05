import { cotizarUrl } from './site.js';
import { initHeroQuotes } from './hero-map.js';

/** Inyecta URLs de cotización en CTAs con data-cotizar */
function initCtaLinks() {
  document.querySelectorAll('[data-cotizar]').forEach((el) => {
    const label = el.getAttribute('data-cotizar') || 'cta';
    el.href = cotizarUrl(label);
  });
}

/** Navbar sólido al hacer scroll */
function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  const onScroll = () => nav.classList.toggle('nav--solid', window.scrollY > 48);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/** Scroll reveal */
function initReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
}

/** FAQ: solo un item abierto a la vez */
function initFaq() {
  const items = document.querySelectorAll('.faq__item');
  items.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      items.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });
}

/** GTM dataLayer + GA4 — eventos click_cotizar_grua */
function initAnalytics() {
  document.querySelectorAll('[data-track="cotizar"]').forEach((el) => {
    el.addEventListener('click', () => {
      // Evento GTM para conversión en Google Ads
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'click_cotizar_grua',
        destination_url: 'https://desvare.app',
        cta_label: el.getAttribute('data-track-label') || 'cta',
      });

      // Evento GA4 legacy (compatibilidad)
      if (typeof gtag === 'function') {
        gtag('event', 'click_cotizar', {
          event_category: 'engagement',
          event_label: el.getAttribute('data-track-label') || 'cta',
        });
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCtaLinks();
  initNav();
  initReveal();
  initFaq();
  initAnalytics();
  initHeroQuotes(document.getElementById('hero-prices'));
});
