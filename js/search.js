/* =========================================================
   Search Module
   - Search input sync
   - Clear buttons
   - Enter key handling
   - Typing feedback
   ========================================================= */

import { snapContainer } from './parallax.js';

const heroInput = document.getElementById("searchInputHero");
const barInput = document.getElementById("searchInputBar");

function syncInputs(from, to) {
  // Avoid ping-pong by only syncing when value actually changed
  if (to.value !== from.value) {
    to.value = from.value;
    to.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function debounce(fn, delay = 300) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

const debouncedSync = debounce((from, to) => syncInputs(from, to), 300);

function goDown() {
  if (snapContainer) {
    snapContainer.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  }
}

function focusTopbarAfterSnap() {
  const checkSticky = setInterval(() => {
    const topbar = document.getElementById("topbar");
    if (topbar && topbar.classList.contains('sticky')) {
      clearInterval(checkSticky);
      const topInput = document.getElementById("searchInputBar");
      if (topInput) {
        setTimeout(() => {
          topInput.focus();
          topInput.setSelectionRange(topInput.value.length, topInput.value.length);
        }, 100);
      }
    }
  }, 50);
}

function handleEnter(e, sourceInput, targetInput, scrollDown = false) {
  if (e.key === 'Enter') {
    e.preventDefault();
    sourceInput.blur();
    document.body.classList.remove('typing');
    
    if (scrollDown) {
      goDown();
      focusTopbarAfterSnap();
    } else {
      syncInputs(sourceInput, targetInput);
    }
  }
}

// Typing feedback
let typingTimer;
const TYPING_DELAY = 450;

function startTypingHint() {
  document.body.classList.add('typing');
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => {
    document.body.classList.remove('typing');
  }, TYPING_DELAY);
}

export function initSearch() {
  if (!heroInput || !barInput) return;

  heroInput.addEventListener("input", () => debouncedSync(heroInput, barInput));
  barInput.addEventListener("input", () => debouncedSync(barInput, heroInput));

  heroInput.addEventListener("keydown", e => handleEnter(e, heroInput, barInput, true));
  barInput.addEventListener("keydown", e => handleEnter(e, barInput, heroInput, false));

  [heroInput, barInput].forEach(el => {
    el.addEventListener('keydown', startTypingHint);
    el.addEventListener('input', startTypingHint);
  });

  // Clear buttons
  document.querySelectorAll('.search-wrap').forEach(wrap => {
    const input = wrap.querySelector('input[type="search"]');
    const clearBtn = wrap.querySelector('.search-clear');
    
    if (!input || !clearBtn) return;

    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
    });

    input.addEventListener('input', () => {
      if (input.value) {
        clearBtn.style.opacity = '0.6';
        clearBtn.style.pointerEvents = 'auto';
      } else {
        clearBtn.style.opacity = '0';
        clearBtn.style.pointerEvents = 'none';
      }
    });
  });
}
