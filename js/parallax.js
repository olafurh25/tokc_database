/* =========================================================
   Parallax & Visual Effects Module
   - Background parallax scrolling
   - Gradient fades
   ========================================================= */

export const HERO = document.getElementById("hero");
export const cardArea = document.getElementById("cardArea");
export const snapContainer = document.querySelector('.snap-container');

// Parallax parameters
const BASE_SPEED = 0.45;   // initial scroll strength
const SLOW_FACTOR = 0.5;   // how much it eases near bottom (0–1)

function getTotalScroll() {
  const scrollTop = snapContainer ? snapContainer.scrollTop : window.scrollY;
  return scrollTop;
}

function getMaxScroll() {
  const totalHeight = snapContainer ? snapContainer.scrollHeight : document.documentElement.scrollHeight;
  const visibleHeight = snapContainer ? snapContainer.clientHeight : window.innerHeight;
  return totalHeight - visibleHeight;
}

function updateParallax() {
  const scrolled = getTotalScroll();
  const maxScroll = getMaxScroll();
  const progress = maxScroll > 0 ? scrolled / maxScroll : 0;
  const slowMultiplier = 1 - progress * SLOW_FACTOR;
  const offset = scrolled * BASE_SPEED * slowMultiplier;
  document.body.style.backgroundPositionY = `${offset}px`;
}

/* crossfade bottom ↔ top gradient */
function updateFades() {
  const scrolled = getTotalScroll();
  const maxScroll = getMaxScroll();
  const scrollRatio = maxScroll > 0 ? scrolled / maxScroll : 0;
  const bottomOpacity = Math.max(0, 1 - scrollRatio * 2);
  const topOpacity = Math.min(1, scrollRatio * 2);
  const before = document.body;
  if (before) {
    before.style.setProperty('--bottom-fade-opacity', bottomOpacity);
    before.style.setProperty('--top-fade-opacity', topOpacity);
  }
}

export function initParallax() {
  (snapContainer || window).addEventListener('scroll', updateParallax, { passive: true });
  (snapContainer || window).addEventListener('scroll', updateFades, { passive: true });
  updateParallax();
  updateFades();
  
  if (cardArea) {
    cardArea.addEventListener("scroll", updateParallax, { passive: true });
  }
}
