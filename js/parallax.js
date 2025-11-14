/* =========================================================
   Parallax & Visual Effects Module
   - Background parallax scrolling
   - Gradient fades
   ========================================================= */

export const HERO = document.getElementById("hero");
export const cardArea = document.getElementById("cardArea");
export const snapContainer = document.querySelector('.snap-container');

// Parallax parameters
const BASE_SPEED = 0.3;   // base parallax strength

// Easing function: starts slow, speeds up, overshoots, then bounces back
function easeOutBack(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

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
  
  // Apply easing with overshoot
  const easedProgress = easeOutBack(progress);
  const offset = scrolled * BASE_SPEED * easedProgress;
  
  document.body.style.backgroundPositionY = `${-offset}px`;
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

function handleCardAreaScroll() {
  if (!cardArea) return;
  
  // If scrolled to top of cardArea, scroll main container to hero
  if (cardArea.scrollTop <= 10) {
    if (snapContainer) {
      snapContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

export function initParallax() {
  (snapContainer || window).addEventListener('scroll', updateParallax, { passive: true });
  (snapContainer || window).addEventListener('scroll', updateFades, { passive: true });
  updateParallax();
  updateFades();
  
  if (cardArea) {
    cardArea.addEventListener("scroll", updateParallax, { passive: true });
    cardArea.addEventListener("scroll", handleCardAreaScroll);
  }
}
