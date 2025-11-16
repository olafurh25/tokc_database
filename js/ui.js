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
  const modal = document.getElementById("advancedModal");
  if (modal) {
    // Reset all filters when opening
    document.querySelectorAll('.advanced-modal input[type="checkbox"]').forEach(cb => {
      cb.checked = false;
    });
    
    document.querySelectorAll('.slider-controls input[type="number"]').forEach(input => {
      input.value = '';
    });
    
    document.querySelectorAll('.text-search-group input[type="text"]').forEach(input => {
      input.value = '';
    });
    
    // Reset preview text
    const previewEl = document.getElementById("queryPreviewText");
    if (previewEl) {
      previewEl.textContent = "Select filters to build your query...";
    }
    
    modal.classList.remove("hidden");
    initAdvancedSearch();
  }
}

function closeAdvanced() {
  const modal = document.getElementById("advancedModal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

function openSyntax() {
  const modal = document.getElementById("syntaxModal");
  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeSyntax() {
  const modal = document.getElementById("syntaxModal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

function initAdvancedSearch() {
  // Update query preview whenever any filter changes
  const updatePreview = () => {
    const query = buildQueryFromFilters();
    const previewEl = document.getElementById("queryPreviewText");
    if (previewEl) {
      previewEl.textContent = query || "Select filters to build your query...";
    }
  };

  // Checkbox listeners
  document.querySelectorAll('.advanced-modal input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', updatePreview);
  });

  // Number input listeners
  document.querySelectorAll('.slider-controls input[type="number"]').forEach(input => {
    input.addEventListener('input', () => {
      // Enforce integer values
      if (input.value) {
        input.value = Math.floor(parseFloat(input.value));
      }
      updatePreview();
    });
  });

  // Text input listeners
  document.querySelectorAll('.text-search-group input[type="text"]').forEach(input => {
    input.addEventListener('input', updatePreview);
  });

  // Copy query button
  document.getElementById('copyQuery')?.addEventListener('click', () => {
    const queryText = document.getElementById('queryPreviewText')?.textContent;
    if (queryText && queryText !== "Select filters to build your query...") {
      navigator.clipboard.writeText(queryText).then(() => {
        const btn = document.getElementById('copyQuery');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      });
    }
  });

  // Reset filters button
  document.getElementById('resetFilters')?.addEventListener('click', () => {
    // Clear all checkboxes
    document.querySelectorAll('.advanced-modal input[type="checkbox"]').forEach(cb => {
      cb.checked = false;
    });
    
    // Clear all number inputs
    document.querySelectorAll('.slider-controls input[type="number"]').forEach(input => {
      input.value = '';
    });
    
    // Clear all text inputs
    document.querySelectorAll('.text-search-group input[type="text"]').forEach(input => {
      input.value = '';
    });
    
    updatePreview();
  });

  // Apply search button
  document.getElementById('applyAdvancedSearch')?.addEventListener('click', () => {
    const query = buildQueryFromFilters();
    if (query) {
      // Update both search inputs
      const heroInput = document.getElementById('searchInputHero');
      const barInput = document.getElementById('searchInputBar');
      
      if (heroInput) {
        heroInput.value = query;
        // Simulate Enter key press
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true
        });
        heroInput.dispatchEvent(enterEvent);
        heroInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (barInput) {
        barInput.value = query;
        barInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    
    closeAdvanced();
    
    // Scroll to results if on hero
    if (window.snapContainer) {
      window.snapContainer.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    }
  });

  // Close button
  document.getElementById('closeAdvanced')?.addEventListener('click', closeAdvanced);

  // Click outside to close
  document.getElementById('advancedModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'advancedModal') {
      closeAdvanced();
    }
  });

  // Enter key to apply search
  const modalContent = document.querySelector('.advanced-content');
  if (modalContent) {
    modalContent.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('applyAdvancedSearch')?.click();
      }
    });
  }
}

function buildQueryFromFilters() {
  const parts = [];

  // Types
  const types = Array.from(document.querySelectorAll('input[name="type"]:checked'))
    .map(cb => cb.value);
  if (types.length > 0) {
    if (types.length === 1) {
      parts.push(`type:${types[0]}`);
    } else {
      parts.push(`(${types.map(t => `type:${t}`).join(' OR ')})`);
    }
  }

  // Factions
  const factions = Array.from(document.querySelectorAll('input[name="faction"]:checked'))
    .map(cb => cb.value);
  if (factions.length > 0) {
    if (factions.length === 1) {
      parts.push(`faction:${factions[0]}`);
    } else {
      parts.push(`(${factions.map(f => `faction:${f}`).join(' OR ')})`);
    }
  }

  // Archetypes
  const archetypes = Array.from(document.querySelectorAll('input[name="archetype"]:checked'))
    .map(cb => cb.value);
  if (archetypes.length > 0) {
    if (archetypes.length === 1) {
      parts.push(`archetype:${archetypes[0]}`);
    } else {
      parts.push(`(${archetypes.map(a => `archetype:${a}`).join(' OR ')})`);
    }
  }

  // Traits
  const traits = Array.from(document.querySelectorAll('input[name="traits"]:checked'))
    .map(cb => cb.value);
  if (traits.length > 0) {
    traits.forEach(trait => {
      parts.push(`traits:${trait}`);
    });
  }

  // Suits
  const suits = Array.from(document.querySelectorAll('input[name="suit"]:checked'))
    .map(cb => cb.value);
  if (suits.length > 0) {
    if (suits.length === 1) {
      parts.push(`suit:${suits[0]}`);
    } else {
      parts.push(`(${suits.map(s => `suit:${s}`).join(' OR ')})`);
    }
  }

  // Stats with ranges
  const addStatRange = (name, field) => {
    const minInput = document.getElementById(`${name}Min`);
    const maxInput = document.getElementById(`${name}Max`);
    const min = minInput?.value;
    const max = maxInput?.value;

    if (min && max) {
      // If min equals max, treat as single value
      if (min === max) {
        parts.push(`${field}:${min}`);
      } else {
        parts.push(`${field}:${min}..${max}`);
      }
    } else if (min) {
      parts.push(`${field}>=${min}`);
    } else if (max) {
      parts.push(`${field}<=${max}`);
    }
  };

  addStatRange('cost', 'cost');
  addStatRange('strength', 'strength');
  addStatRange('votes', 'votes');
  addStatRange('lore', 'lore');

  // Text searches
  const titleSearch = document.getElementById('titleSearch')?.value.trim();
  if (titleSearch) {
    parts.push(`title:"${titleSearch}"`);
  }

  const rulesSearch = document.getElementById('rulesSearch')?.value.trim();
  if (rulesSearch) {
    parts.push(`rules:"${rulesSearch}"`);
  }

  const commandsSearch = document.getElementById('commandsSearch')?.value.trim();
  if (commandsSearch) {
    parts.push(`commands:"${commandsSearch}"`);
  }

  return parts.join(' ');
}

function openRandom() {
  if (window.cards && window.cards.length > 0) {
    const randomCard = window.cards[Math.floor(Math.random() * window.cards.length)];
    if (window.openModal) window.openModal(randomCard.id);
  }
}

function initButtons() {
  // Syntax guide modal
  document.getElementById("closeSyntax")?.addEventListener("click", closeSyntax);
  document.getElementById("closeSyntaxBtn")?.addEventListener("click", closeSyntax);

  document.getElementById("syntaxModal")?.addEventListener("click", e => {
    if (e.target.id === "syntaxModal") {
      closeSyntax();
    }
  });

  // Advanced search modal
  document.getElementById("closeAdvanced")?.addEventListener("click", closeAdvanced);
  
  document.getElementById("advancedModal")?.addEventListener("click", e => {
    if (e.target.id === "advancedModal") {
      closeAdvanced();
    }
  });

  [
    ["advancedBtn", openAdvanced],
    ["syntaxBtn", openSyntax],
    ["randomBtn", openRandom],
    ["advancedBtnTop", openAdvanced],
    ["syntaxBtnTop", openSyntax],
    ["randomBtnTop", openRandom],
    ["advancedBtnMobile", openAdvanced],
    ["syntaxBtnMobile", openSyntax],
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
