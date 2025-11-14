/* =========================================================
   UI Module
   - Sticky topbar
   - Button actions
   - Hamburger menu
   - Loading screen
   - No results message
   ========================================================= */

import { HERO, snapContainer, setTopbarSticky } from './parallax.js';

const topbar = document.getElementById("topbar");
const noResults = document.getElementById("noResults");
const loadingScreen = document.getElementById("loadingScreen");

export function hideLoadingScreen() {
  if (loadingScreen) {
    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
      loadingScreen.remove();
    }, 600);
  }
}

function initStickyTopbar() {
  if (!topbar || !HERO) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const isSticky = !entry.isIntersecting;
      topbar.classList.toggle('sticky', isSticky);
      setTopbarSticky(isSticky);
    });
  }, { root: snapContainer || null, threshold: 0.01 });
  
  observer.observe(HERO);
}

function initNoResultsFade() {
  if (!noResults) return;

  (snapContainer || window).addEventListener("scroll", () => {
    const scrolled = snapContainer ? snapContainer.scrollTop : window.scrollY;
    if (scrolled > 100 && !noResults.classList.contains("hidden")) {
      const opacity = Math.max(0, 1 - (scrolled - 100) / 300);
      noResults.style.opacity = opacity;
    } else if (scrolled <= 100) {
      noResults.style.opacity = 1;
    }
  }, { passive: true });
}

function openAdvanced() {
  alert("Advanced filters coming soon!");
}

function openSyntaxGuide() {
  document.getElementById("syntaxModal")?.classList.remove("hidden");
}

function openRandom() {
  if (window.cards && window.cards.length > 0) {
    const randomCard = window.cards[Math.floor(Math.random() * window.cards.length)];
    if (window.openModal) window.openModal(randomCard.id);
  }
}

function initButtons() {
  document.getElementById("closeSyntax")?.addEventListener("click", () => {
    document.getElementById("syntaxModal")?.classList.add("hidden");
  });

  document.getElementById("syntaxModal")?.addEventListener("click", e => {
    if (e.target.id === "syntaxModal") {
      document.getElementById("syntaxModal")?.classList.add("hidden");
    }
  });

  [
    ["advancedBtn", openAdvanced],
    ["syntaxBtn", openSyntaxGuide],
    ["randomBtn", openRandom],
    ["advancedBtnTop", openAdvanced],
    ["syntaxBtnTop", openSyntaxGuide],
    ["randomBtnTop", openRandom],
    ["advancedBtnMobile", openAdvanced],
    ["syntaxBtnMobile", openSyntaxGuide],
    ["randomBtnMobile", openRandom],
  ].forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  });
}

function initHamburgerMenu() {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const hamburgerMenu = document.getElementById("hamburgerMenu");

  if (hamburgerBtn && hamburgerMenu) {
    hamburgerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      hamburgerMenu.classList.toggle("hidden");
    });

    hamburgerMenu.querySelectorAll(".hamburger-item").forEach(item => {
      item.addEventListener("click", () => {
        hamburgerMenu.classList.add("hidden");
      });
    });

    document.addEventListener("click", (e) => {
      if (!hamburgerMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
        hamburgerMenu.classList.add("hidden");
      }
    });
  }
}

function initLogoClick() {
  const logoEl = document.querySelector('.topbar-logo');
  if (logoEl) {
    logoEl.addEventListener('click', () => {
      if (snapContainer) {
        snapContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      const heroInput = document.getElementById("searchInputHero");
      setTimeout(() => {
        if (heroInput) heroInput.focus();
      }, 500);
    });
  }
}

export function initUI() {
  initStickyTopbar();
  initNoResultsFade();
  initButtons();
  initHamburgerMenu();
  initLogoClick();

  window.addEventListener('load', () => {
    setTimeout(hideLoadingScreen, 200);
  });
}
