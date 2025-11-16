/* =========================================================
   Modal Module
   - Card detail modal
   - Modal interactions
   ========================================================= */

import { cards } from './cards.js';
import { prettyScalar, prettyArray, prettyRelease, prettyPowerBits } from './labels.js';
import { renderCommandsBlock, renderRulesBlock, injectIconsToHTML, iconLabel } from './icons.js';

const modal = document.getElementById("modal");
const cardGrid = document.getElementById("cardGrid");
let currentOpenCard = null; // Track the card element that opened the modal
let currentCardList = []; // Track the current list of cards being viewed
let currentCardIndex = -1; // Track the index of the currently viewed card

export function openModal(id, cardList = null) {
  const card = cards.find(c => String(c.id) === String(id));
  if (!card || !modal) return;

  // Update card list and index for navigation
  if (cardList) {
    currentCardList = cardList;
  } else {
    // Get cards from the current grid display
    const gridCards = Array.from(document.querySelectorAll('#cardGrid .card'));
    currentCardList = gridCards.map(el => el.getAttribute('data-id')).filter(Boolean);
  }
  currentCardIndex = currentCardList.indexOf(String(id));

  const modalImage = document.getElementById("modalArt");
  const modalName = document.getElementById("modalName");
  const modalTypeFaction = document.getElementById("modalTypeFaction");
  const modalMeta = document.getElementById("modalMeta");
  const modalCmd = document.getElementById("modalCmd");
  const modalRules = document.getElementById("modalRules");
  const modalFlavour = document.getElementById("modalFlavour");
  const metaRelease = document.getElementById("metaRelease");
  const artwrap = document.querySelector('.modal-artwrap');
  const modalInner = document.querySelector('.modal-inner');

  if (modalImage) modalImage.src = card.image;
  if (modalImage) modalImage.alt = card.title;
  if (modalName) modalName.textContent = card.title;

  // Set faction data attribute for styling
  if (modalInner) {
    if (card.faction) {
      modalInner.setAttribute('data-faction', card.faction);
    } else {
      modalInner.removeAttribute('data-faction');
    }
  }

  // Set faction data attribute on modal for background tint
  if (modal) {
    if (card.faction) {
      modal.setAttribute('data-faction', card.faction);
    } else {
      modal.removeAttribute('data-faction');
    }
  }

  if (artwrap) {
    if (card.archetype === 'hq') {
      artwrap.classList.add('is-hq');
    } else {
      artwrap.classList.remove('is-hq');
    }
  }

  const typeLine = prettyScalar('type', card.type);
  const factionLine = card.faction ? prettyScalar('faction', card.faction) : null;
  const archetypeLine = card.archetype ? prettyScalar('archetype', card.archetype) : null;

  let fullLine = typeLine;
  if (factionLine) {
    const factionIcon = iconLabel(`<${card.faction}>`, factionLine);
    fullLine += ` ⬩ ${factionIcon}`;
  }

  if (modalTypeFaction) modalTypeFaction.innerHTML = fullLine;

  const metaParts = [];
  
  const powerLine = prettyPowerBits(card);
  if (powerLine) {
    const topRow = [];
    if (card.strength != null) topRow.push(`Strength: <span class="strength-value">${card.strength}</span>`);
    if (archetypeLine) {
      const archetypeIcon = iconLabel(`<${card.archetype}>`, archetypeLine);
      topRow.push(archetypeIcon);
    }
    if (card.cost != null) topRow.push(`Lore Cost: ${iconLabel('<cost>', String(card.cost))}`);
    if (topRow.length > 0) metaParts.push(`<div class="meta-row">${topRow.join(' ⬩ ')}</div>`);
  }

  if (card.traits && card.traits.length > 0) {
    const traitIcons = card.traits.map(trait => iconLabel(`<${trait}>`, prettyScalar('traits', trait)));
    metaParts.push(`<div class="meta-row">${traitIcons.join(' ⬩ ')}</div>`);
  }

  if (card.suit) {
    const suitStr = prettyScalar('suit', card.suit);
    const suitIcon = iconLabel(`<${card.suit}>`, suitStr);
    metaParts.push(`<div class="meta-row">${suitIcon}</div>`);
  }

  if (modalMeta) modalMeta.innerHTML = metaParts.join('');

  if (modalCmd) {
    const cmdHtml = renderCommandsBlock(card.commands);
    modalCmd.innerHTML = cmdHtml;
    modalCmd.style.display = cmdHtml ? 'block' : 'none';
  }

  if (modalRules) {
    const rulesHtml = renderRulesBlock(card.rules);
    modalRules.innerHTML = rulesHtml;
    modalRules.style.display = rulesHtml ? 'block' : 'none';
  }

  if (modalFlavour) {
    const flavourHtml = card.flavour ? injectIconsToHTML(card.flavour) : '';
    modalFlavour.innerHTML = flavourHtml;
    modalFlavour.style.display = flavourHtml ? 'block' : 'none';
  }

  // Add votes and lore beneath flavour text
  const existingBottomStats = document.querySelector('.modal-panel .bottom-stats');
  if (existingBottomStats) existingBottomStats.remove();
  
  const bottomStats = [];
  if (card.votes != null && card.votes > 0) {
    const votesIcons = Array(card.votes).fill(iconLabel('<votes>', '')).join('');
    bottomStats.push(`Votes:&nbsp; ${votesIcons}`);
  }
  if (card.lore != null && card.lore > 0) {
    const loreIcons = Array(card.lore).fill(iconLabel('<lore>', '')).join('');
    bottomStats.push(`Lore:&nbsp; ${loreIcons}`);
  }
  if (bottomStats.length > 0) {
    const bottomStatsDiv = document.createElement('div');
    bottomStatsDiv.className = 'meta-row bottom-stats';
    bottomStatsDiv.style.marginTop = '1rem';
    bottomStatsDiv.innerHTML = bottomStats.join(' ⬩&nbsp; ');
    if (modalFlavour && modalFlavour.parentNode) {
      modalFlavour.parentNode.insertBefore(bottomStatsDiv, modalFlavour.nextSibling);
    }
  }

  if (metaRelease) {
    const releaseStr = prettyRelease(card.release);
    const idStr = card.id ? ` ⬩ ID: ${card.id}` : '';
    metaRelease.textContent = releaseStr + idStr;
    metaRelease.style.display = releaseStr ? 'block' : 'none';
  }

  // Show related cards
  renderRelatedCards(card);

  // Mark the grid card as having modal open
  if (currentOpenCard) currentOpenCard.classList.remove('modal-open');
  const gridCard = document.querySelector(`.card[data-id="${id}"]`);
  if (gridCard) {
    gridCard.classList.add('modal-open');
    currentOpenCard = gridCard;
  }

  // Update navigation button visibility
  const prevBtn = document.getElementById('modalPrev');
  const nextBtn = document.getElementById('modalNext');
  if (prevBtn) prevBtn.style.display = currentCardIndex > 0 ? 'flex' : 'none';
  if (nextBtn) nextBtn.style.display = currentCardIndex < currentCardList.length - 1 ? 'flex' : 'none';

  modal.classList.add('visible');
  modal.style.display = 'grid';
}

function findRelatedCards(currentCard, limit = 6) {
  const related = [];
  
  // Calculate similarity score for each card
  cards.forEach(otherCard => {
    if (otherCard.id === currentCard.id) return; // Skip the current card
    
    let score = 0;
    
    // Tags match (highest priority)
    if (currentCard.tags && otherCard.tags) {
      const currentTags = Array.isArray(currentCard.tags) ? currentCard.tags : [currentCard.tags];
      const otherTags = Array.isArray(otherCard.tags) ? otherCard.tags : [otherCard.tags];
      const commonTags = currentTags.filter(tag => otherTags.includes(tag));
      score += commonTags.length * 10; // 10 points per shared tag
    }
    
    // Same archetype
    if (currentCard.archetype && currentCard.archetype === otherCard.archetype) {
      score += 4;
    }
    
    // Same type
    if (currentCard.type === otherCard.type) {
      score += 3;
    }
    
    // Shared traits
    if (currentCard.traits && otherCard.traits) {
      const currentTraits = Array.isArray(currentCard.traits) ? currentCard.traits : [currentCard.traits];
      const otherTraits = Array.isArray(otherCard.traits) ? otherCard.traits : [otherCard.traits];
      const commonTraits = currentTraits.filter(trait => otherTraits.includes(trait));
      score += commonTraits.length * 3; // 3 points per shared trait
    }
    
    // Similar strength
    if (currentCard.strength != null && otherCard.strength != null) {
      const strDiff = Math.abs(currentCard.strength - otherCard.strength);
      if (strDiff === 0) score += 2;
      else if (strDiff <= 2) score += 1;
    }
    
    if (score > 0) {
      related.push({ card: otherCard, score });
    }
  });
  
  // Sort by score and return top matches
  related.sort((a, b) => b.score - a.score);
  return related.slice(0, limit).map(item => item.card);
}

function renderRelatedCards(currentCard) {
  const relatedSection = document.getElementById('relatedCards');
  const relatedGrid = document.getElementById('relatedCardsGrid');
  
  if (!relatedSection || !relatedGrid) return;
  
  const relatedCards = findRelatedCards(currentCard, 6);
  
  if (relatedCards.length === 0) {
    relatedSection.style.display = 'none';
    return;
  }
  
  relatedGrid.innerHTML = '';
  relatedCards.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.className = 'related-card';
    cardEl.innerHTML = `<img src="${card.image}" alt="${card.title}" />`;
    cardEl.addEventListener('click', () => {
      openModal(card.id);
    });
    relatedGrid.appendChild(cardEl);
  });
  
  relatedSection.style.display = 'block';
}

function navigateCard(direction) {
  if (currentCardList.length === 0) return;
  
  const newIndex = currentCardIndex + direction;
  if (newIndex < 0 || newIndex >= currentCardList.length) return;
  
  const modalInner = document.querySelector('.modal-inner');
  const slideDirection = direction > 0 ? 'slide-left' : 'slide-right';
  
  // Add slide-out animation
  modalInner.classList.add(slideDirection);
  
  setTimeout(() => {
    // Open new card
    openModal(currentCardList[newIndex], currentCardList);
    
    // Reset and add slide-in animation
    modalInner.classList.remove(slideDirection);
    const slideIn = direction > 0 ? 'slide-in-right' : 'slide-in-left';
    modalInner.classList.add(slideIn);
    
    setTimeout(() => {
      modalInner.classList.remove(slideIn);
    }, 300);
  }, 150);
}

function dismissModal() {
  if (modal) {
    modal.classList.remove('visible');
    modal.style.display = 'none';
  }
  // Remove rotation state from grid card
  if (currentOpenCard) {
    currentOpenCard.classList.remove('modal-open');
    currentOpenCard = null;
  }
}

export function initModal() {
  if (!modal) return;

  const closeBtn = document.getElementById("closeModal");
  if (closeBtn) {
    closeBtn.addEventListener('click', dismissModal);
  }

  // Dismiss on any click inside modal
  modal.addEventListener('click', (e) => {
    // Don't dismiss if clicking on related cards
    if (e.target.closest('.related-cards')) return;
    dismissModal();
  });
  
  const modalContent = document.getElementById('modalContent');
  if (modalContent) {
    modalContent.addEventListener('click', (e) => {
      // Don't dismiss if clicking on related cards
      if (e.target.closest('.related-cards')) return;
      dismissModal();
    });
  }

  // Prevent clicks on modal-inner from bubbling up
  const modalInner = document.querySelector('.modal-inner');
  if (modalInner) {
    modalInner.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // Prevent clicks on related cards from bubbling up
  const relatedSection = document.getElementById('relatedCards');
  if (relatedSection) {
    relatedSection.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Touch support for expanding related cards on mobile
    let touchStartY = 0;
    relatedSection.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    relatedSection.addEventListener('touchmove', (e) => {
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;
      
      // If swiping up on related cards, expand them
      if (deltaY > 30) {
        relatedSection.classList.add('expanded');
      }
    }, { passive: true });
  }

  // Navigation chevrons
  const prevBtn = document.getElementById('modalPrev');
  const nextBtn = document.getElementById('modalNext');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateCard(-1);
    });
    
    // Touch feedback
    prevBtn.addEventListener('touchstart', (e) => {
      e.currentTarget.style.opacity = '0.6';
    }, { passive: true });
    
    prevBtn.addEventListener('touchend', (e) => {
      e.currentTarget.style.opacity = '';
    }, { passive: true });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateCard(1);
    });
    
    // Touch feedback
    nextBtn.addEventListener('touchstart', (e) => {
      e.currentTarget.style.opacity = '0.6';
    }, { passive: true });
    
    nextBtn.addEventListener('touchend', (e) => {
      e.currentTarget.style.opacity = '';
    }, { passive: true });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') dismissModal();
    if (modal.style.display === 'grid') {
      if (e.key === 'ArrowLeft') navigateCard(-1);
      if (e.key === 'ArrowRight') navigateCard(1);
    }
  });

  if (cardGrid) {
    cardGrid.addEventListener('click', (e) => {
      // Check if click is on card or within card (including card-rotator)
      const card = e.target.closest('.card');
      if (card) {
        const id = card.getAttribute('data-id');
        if (id) openModal(id);
      }
    });

    cardGrid.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const card = e.target.closest('.card');
        if (card) {
          const id = card.getAttribute('data-id');
          if (id) openModal(id);
        }
      }
    });

    // Mobile press → rotate (HQ only)
    let __pressCard = null;
    cardGrid.addEventListener('touchstart', (e) => {
      const card = e.target.closest('.card.is-hq');
      if (card) {
        __pressCard = card;
        card.classList.add('is-press');
      }
    }, { passive: true });

    ['touchend', 'touchcancel'].forEach(evt => {
      cardGrid.addEventListener(evt, () => {
        if (__pressCard) {
          __pressCard.classList.remove('is-press');
          __pressCard = null;
        }
      }, { passive: true });
    });
  }
}

// Make openModal available globally
window.openModal = openModal;
