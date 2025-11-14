/* =========================================================
   Main Entry Point
   - Initializes all modules
   - Loads card data
   - Starts the application
   ========================================================= */

import { initParallax } from './parallax.js';
import { initSearch } from './search.js';
import { initUI } from './ui.js';
import { loadCards, applyQuery, initCards } from './cards.js';
import { initModal } from './modal.js';

async function init() {
  try {
    // Initialize UI components
    initParallax();
    initSearch();
    initUI();
    initModal();

    // Load card data
    await loadCards();
    
    // Initialize card-related functionality
    initCards();

    // Initial render
    applyQuery();
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
