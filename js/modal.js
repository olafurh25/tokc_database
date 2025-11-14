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

export function openModal(id) {
  const card = cards.find(c => String(c.id) === String(id));
  if (!card || !modal) return;

  const modalImage = document.getElementById("modalArt");
  const modalName = document.getElementById("modalName");
  const modalTypeFaction = document.getElementById("modalTypeFaction");
  const modalMeta = document.getElementById("modalMeta");
  const modalCmd = document.getElementById("modalCmd");
  const modalRules = document.getElementById("modalRules");
  const modalFlavour = document.getElementById("modalFlavour");
  const metaRelease = document.getElementById("metaRelease");
  const artwrap = document.querySelector('.modal-artwrap');

  if (modalImage) modalImage.src = card.image;
  if (modalImage) modalImage.alt = card.title;
  if (modalName) modalName.textContent = card.title;

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
  if (archetypeLine) fullLine += ` ⬩ ${archetypeLine}`;

  if (modalTypeFaction) modalTypeFaction.innerHTML = fullLine;

  const metaParts = [];
  if (card.traits && card.traits.length > 0) {
    const traitsStr = prettyArray('traits', card.traits);
    metaParts.push(`<div class="meta-row">${iconLabel('<resilient>', traitsStr)}</div>`);
  }

  const powerLine = prettyPowerBits(card);
  if (powerLine) {
    const icons = [];
    if (card.cost != null) icons.push(iconLabel('<cost>', String(card.cost)));
    if (card.strength != null) icons.push(`Strength: <span class="strength-value">${card.strength}</span>`);
    if (card.votes != null) icons.push(iconLabel('<votes>', String(card.votes)));
    if (card.lore != null) icons.push(iconLabel('<lore>', String(card.lore)));
    metaParts.push(`<div class="meta-row">${icons.join(' ⬩ ')}</div>`);
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

  if (metaRelease) {
    const releaseStr = prettyRelease(card.release);
    metaRelease.textContent = releaseStr;
    metaRelease.style.display = releaseStr ? 'block' : 'none';
  }

  // Mark the grid card as having modal open
  if (currentOpenCard) currentOpenCard.classList.remove('modal-open');
  const gridCard = document.querySelector(`.card[data-id="${id}"]`);
  if (gridCard) {
    gridCard.classList.add('modal-open');
    currentOpenCard = gridCard;
  }

  modal.classList.add('visible');
  modal.style.display = 'grid';
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
  modal.addEventListener('click', dismissModal);
  
  const modalContent = document.getElementById('modalContent');
  if (modalContent) {
    modalContent.addEventListener('click', dismissModal);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') dismissModal();
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
        card.classList.add('pressed');
      }
    }, { passive: true });

    ['touchend', 'touchcancel'].forEach(evt => {
      cardGrid.addEventListener(evt, () => {
        if (__pressCard) {
          __pressCard.classList.remove('pressed');
          __pressCard = null;
        }
      }, { passive: true });
    });
  }
}

// Make openModal available globally
window.openModal = openModal;
