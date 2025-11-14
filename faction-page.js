/* =========================================================
   Faction Page JavaScript
   - Loads and filters cards for specific faction
   - Uses modular structure
   ========================================================= */

import { loadCards } from './js/cards.js';
import { initModal } from './js/modal.js';
import { initUI, hideLoadingScreen } from './js/ui.js';

// Get faction from script tag data attribute
const currentScript = document.currentScript;
const faction = currentScript.getAttribute('data-faction');

// Initialize modules
initUI();
initModal();

// Wait for DOM and cards to be loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Load cards
  const cards = await loadCards();

  // Filter cards for this faction (including basic, advanced, kingdom cards)
  const factionCards = cards.filter(card => {
    // Include basic and advanced faction cards
    if ((card.type === 'basic' || card.type === 'advanced') && card.faction === faction) {
      return true;
    }
    // Include kingdom cards that belong to this faction
    if (card.type === 'kingdom' && card.faction === faction) {
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

  // Render all faction cards
  renderFactionCards(factionCards);

  // Hide loading screen
  setTimeout(hideLoadingScreen, 200);
});

// Render faction cards to the grid
function renderFactionCards(factionCards) {
  const grid = document.getElementById('cardGrid');
  if (!grid) return;

  grid.innerHTML = '';

  factionCards.forEach(card => {
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
  const cards = grid.querySelectorAll('.card');
  cards.forEach((card, i) => {
    card.style.animationDelay = `${i * 0.03}s`;
    card.classList.add('card-enter');
  });
}

// Modal is handled by app.js openModal function which is already loaded
// Card click events are also handled by the app.js event delegation on cardGrid
