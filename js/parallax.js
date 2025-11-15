/* =========================================================
   Parallax & Visual Effects Module
   - Background parallax scrolling
   - Gradient fades
   ========================================================= */

export const HERO = document.getElementById("hero");
export const cardArea = document.getElementById("cardArea");
export const snapContainer = document.querySelector('.snap-container');

// Parallax parameters stay as they are…
const BASE_SPEED = 0.45;
const SLOW_FACTOR = 0.5;

function getTotalScroll() {
  const outer = snapContainer ? snapContainer.scrollTop : window.scrollY || 0;
  const inner = cardArea ? cardArea.scrollTop : 0;
  return outer + inner;
}

function getMaxScroll() {
  let outerMax, innerMax;

  if (snapContainer) {
    outerMax = snapContainer.scrollHeight - snapContainer.clientHeight;
  } else {
    outerMax = document.documentElement.scrollHeight - window.innerHeight;
  }

  if (cardArea) {
    innerMax = cardArea.scrollHeight - cardArea.clientHeight;
  } else {
    innerMax = 0;
  }

  return outerMax + innerMax;
}

function updateParallax() {
  const scrolled = getTotalScroll();
  const maxScroll = getMaxScroll();
  const progress = maxScroll > 0 ? scrolled / maxScroll : 0;
  const slowMultiplier = 1 - progress * SLOW_FACTOR;
  const offset = scrolled * BASE_SPEED * slowMultiplier;
  
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

let isAtTop = false;
let hasScrolledUpFromTop = false;
let isTopbarSticky = false;

// Export function to update topbar state
export function setTopbarSticky(sticky) {
  isTopbarSticky = sticky;
}

function handleCardAreaWheel(e) {
  if (!cardArea) return;
  
  // Block scrolling in cardArea until topbar is sticky
  if (!isTopbarSticky) {
    e.preventDefault();
    return;
  }
  
  const isScrollingUp = e.deltaY < 0;
  const currentScrollTop = cardArea.scrollTop;
  
  // When at top of card grid and scrolling up, immediately transport to hero
  if (currentScrollTop <= 0 && isScrollingUp) {
    e.preventDefault();
    if (snapContainer) {
      snapContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    const heroInput = document.getElementById("searchInputHero");
    setTimeout(() => {
      if (heroInput) heroInput.focus();
    }, 500);
  }
}

let targetScrollTop = 0;
let currentScrollTop = 0;
let scrolling = false;
let velocity = 0;
let lastWheelTime = 0;

function smoothScroll() {
  if (!snapContainer) return;
  
  // Apply velocity for inertia
  targetScrollTop += velocity;
  
  // Dampen velocity
  velocity *= 0.92;
  
  // Clamp target scroll
  targetScrollTop = Math.max(0, Math.min(
    snapContainer.scrollHeight - snapContainer.clientHeight,
    targetScrollTop
  ));
  
  const diff = targetScrollTop - currentScrollTop;
  
  if (Math.abs(diff) > 0.5 || Math.abs(velocity) > 0.1) {
    currentScrollTop += diff * 0.15; // Easing factor
    snapContainer.scrollTop = currentScrollTop;
    requestAnimationFrame(smoothScroll);
  } else {
    currentScrollTop = targetScrollTop;
    snapContainer.scrollTop = currentScrollTop;
    velocity = 0;
    scrolling = false;
  }
}

function handleOuterWheel(e) {
  if (!snapContainer) return;
  
  // Don't intercept if the event is from within cardArea
  if (cardArea && cardArea.contains(e.target)) {
    return;
  }
  
  const isScrollingUp = e.deltaY < 0;
  const isScrollingDown = e.deltaY > 0;
  
  // Amplify scroll speed in outer container
  const scrollMultiplier = 4.5;
  
  if (isScrollingDown || isScrollingUp) {
    e.preventDefault();
    
    const now = Date.now();
    const timeDelta = now - lastWheelTime;
    lastWheelTime = now;
    
    // Update target scroll position
    if (!scrolling) {
      currentScrollTop = snapContainer.scrollTop;
      targetScrollTop = currentScrollTop;
    }
    
    // Add to velocity for inertia effect
    const scrollDelta = e.deltaY * scrollMultiplier;
    velocity += scrollDelta * 0.15;
    
    // Also immediately update target
    targetScrollTop += scrollDelta;
    
    // Start smooth scrolling if not already running
    if (!scrolling) {
      scrolling = true;
      requestAnimationFrame(smoothScroll);
    }
  }
  
  // If outer container is past hero and scrolling up
  if (targetScrollTop > 0 && targetScrollTop <= window.innerHeight && isScrollingUp) {
    // Check if this would scroll into hero section
    if (targetScrollTop - Math.abs(e.deltaY * scrollMultiplier) <= 0) {
      targetScrollTop = 0;
      const heroInput = document.getElementById("searchInputHero");
      setTimeout(() => {
        if (heroInput) heroInput.focus();
      }, 500);
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
    cardArea.addEventListener("scroll", updateFades, { passive: true });
    cardArea.addEventListener("wheel", handleCardAreaWheel, { passive: false });
  }
  
  if (snapContainer) {
    snapContainer.addEventListener("wheel", handleOuterWheel, { passive: false });
  }
}
