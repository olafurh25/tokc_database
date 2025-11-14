/* =========================================================
   Faction Page JavaScript
   - Loads and filters cards for specific faction
   - Uses modular structure
   ========================================================= */

import { loadCards } from './js/cards.js';
import { initModal } from './js/modal.js';

// Get faction from body class (e.g., "clans-page" -> "clans")
const bodyClasses = document.body.className;
// Match specific faction names, not "faction-page"
const factionMatch = bodyClasses.match(/(clans|uprising|gathering|nobility)-page/);
const faction = factionMatch ? factionMatch[1] : null;

console.log('Detected faction:', faction);

// Hide loading screen helper
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
      loadingScreen.remove();
    }, 600);
  }
}

// Initialize modal
initModal();

async function initFactionPage() {
  console.log('Initializing faction page for:', faction);
  
  if (!faction) {
    console.error('No faction detected! Body classes:', document.body.className);
    return;
  }
  
  // Load cards
  const cards = await loadCards();
  console.log('Cards loaded:', cards.length);

  // Filter cards for this faction
  const factionCards = cards.filter(card => {
    // Include basic and advanced faction cards
    if ((card.type === 'basic' || card.type === 'advanced') && card.faction === faction) {
      return true;
    }
    // Include tactic cards for this faction
    if (card.type === 'tactic' && card.faction === faction) {
      return true;
    }
    // Include favour cards for this faction
    if (card.type === 'favour' && card.faction === faction) {
      return true;
    }
    return false;
  });

  // Sort cards by type priority and then by cost/strength
  const typePriority = { 'favour': 0, 'basic': 1, 'advanced': 2, 'kingdom': 3 };
  factionCards.sort((a, b) => {
    // First by type
    const typeA = typePriority[a.type] ?? 99;
    const typeB = typePriority[b.type] ?? 99;
    if (typeA !== typeB) return typeA - typeB;

    // Then by cost (for advanced)
    if (a.cost !== null && b.cost !== null) {
      if (a.cost !== b.cost) return a.cost - b.cost;
    }

    // Then by strength
    const strA = a.strength ?? -1;
    const strB = b.strength ?? -1;
    return strA - strB;
  });

  console.log('Filtered faction cards:', factionCards.length);

  // Render all faction cards
  renderFactionCards(factionCards);

  // Hide loading screen
  setTimeout(hideLoadingScreen, 200);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFactionPage);
} else {
  initFactionPage();
}

// Render faction cards to the grid
function renderFactionCards(factionCards) {
  console.log('Rendering', factionCards.length, 'cards');

  // Group cards by type (only the types we want to display)
  const cardsByType = {
    favour: [],
    tactic: [],
    advanced: [],
    basic: []
  };

  factionCards.forEach(card => {
    if (cardsByType[card.type]) {
      cardsByType[card.type].push(card);
    } else {
      console.log('Skipping card with type:', card.type, card.title);
    }
  });

  console.log('Cards by type:', Object.keys(cardsByType).map(k => `${k}: ${cardsByType[k].length}`));

  // Render each type into its own grid
  Object.entries(cardsByType).forEach(([type, cards]) => {
    console.log(`Processing type: ${type}, cards: ${cards.length}`);
    if (cards.length === 0) return;

    const grid = document.getElementById(`${type}Grid`);
    const section = document.getElementById(`${type}Section`);
    
    if (!grid || !section) {
      console.error(`Grid or section not found for type: ${type}`);
      return;
    }

    // Show the section
    section.style.display = 'block';
    grid.innerHTML = '';

    cards.forEach(card => {
      const cardDiv = document.createElement('div');
      cardDiv.className = 'card';
      cardDiv.setAttribute('data-id', card.id);
      cardDiv.setAttribute('tabindex', '0');
      
      // Add HQ class if applicable
      if (card.archetype === 'hq') {
        cardDiv.classList.add('is-hq');
      }

      // Create card HTML
      let innerHTML = '';
      
      if (card.archetype === 'hq') {
        // HQ cards use rotator
        innerHTML = `
          <div class="card-rotator">
            <img src="${card.image}" alt="${card.title}" loading="eager" decoding="async">
          </div>
        `;
      } else {
        // Regular cards
        innerHTML = `<img src="${card.image}" alt="${card.title}" loading="eager" decoding="async">`;
      }

      cardDiv.innerHTML = innerHTML;
      grid.appendChild(cardDiv);
    });

    // Add entrance animation
    const cardElements = grid.querySelectorAll('.card');
    cardElements.forEach((card, i) => {
      card.style.animationDelay = `${i * 0.03}s`;
      card.classList.add('card-enter');
    });

    // Add click handlers for modal
    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.card');
      if (card) {
        const id = card.getAttribute('data-id');
        if (id && window.openModal) window.openModal(id);
      }
    });

    grid.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const card = e.target.closest('.card');
        if (card) {
          const id = card.getAttribute('data-id');
          if (id && window.openModal) window.openModal(id);
        }
      }
    });

    // Mobile touch handlers for HQ cards
    let pressedCard = null;
    grid.addEventListener('touchstart', (e) => {
      const card = e.target.closest('.card.is-hq');
      if (card) {
        pressedCard = card;
        card.classList.add('pressed');
      }
    }, { passive: true });

    ['touchend', 'touchcancel'].forEach(evt => {
      grid.addEventListener(evt, () => {
        if (pressedCard) {
          pressedCard.classList.remove('pressed');
          pressedCard = null;
        }
      }, { passive: true });
    });
  });
}
