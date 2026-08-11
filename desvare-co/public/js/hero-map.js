import { heroQuotes } from './site.js';

/** Renderiza globos de precio animados sobre el mapa del hero */
export function initHeroQuotes(container) {
  if (!container) return;

  heroQuotes.forEach((q) => {
    const bubble = document.createElement('div');
    bubble.className = `price-bubble price-bubble--${q.id}${q.blur ? ' price-bubble--blur' : ''}`;
    bubble.style.animationDelay = q.delay;
    bubble.setAttribute('aria-hidden', 'true');

    const value = document.createElement('span');
    value.className = 'price-bubble__value';
    value.textContent = q.price;

    bubble.appendChild(value);
    container.appendChild(bubble);
  });
}
