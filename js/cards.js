/* =========================================================
   Cards Module
   - Card data loading
   - Card rendering
   - Pagination
   - Sorting
   ========================================================= */

import { matchCard } from './query-engine.js';
import { prettyScalar, prettyPowerBits } from './labels.js';
import { ALIAS } from './query-engine.js';
import { cardArea } from './parallax.js';

export let cards = [];
export let page = 1;
export const PAGE_SIZE = 28;
export let currentQuery = "";
export let filteredList = [];
export let sortField = "none";
export let sortOrder = "asc";

const NUMERIC_KEYS = new Set(["cost", "strength", "votes", "lore"]);

const cardGrid = document.getElementById("cardGrid");
const loadWrap = document.querySelector('.load-more-wrapper');
const noResultsEl = document.getElementById('noResults');
const sortSelect = document.getElementById('sortSelect');
const sortOrderBtn = document.getElementById('sortOrderBtn');
const resultsMessage = document.getElementById('resultsMessage');

// Track whether we've rendered at least once to allow skipping duplicate renders
let hasRenderedOnce = false;

export async function loadCards() {
  try {
    const response = await fetch('data/data.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    cards = await response.json();
    console.log(`Loaded ${cards.length} cards`);
    window.cards = cards; // Make available globally for faction pages
    return cards;
  } catch (error) {
    console.error('Error loading cards:', error);
    cards = [];
    window.cards = [];
    return [];
  }
}

export function applySortAndRender() {
  if (sortField === "none") {
    renderNextPage(true);
    return;
  }

  const sorted = [...filteredList].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (NUMERIC_KEYS.has(sortField)) {
      const aNum = aVal ?? -Infinity;
      const bNum = bVal ?? -Infinity;
      return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
    } else {
      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();
      if (sortOrder === "asc") {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    }
  });

  filteredList = sorted;
  page = 1;
  renderNextPage(true);
  updateResultsMessage();
}

export function updateResultsMessage() {
  if (!resultsMessage) return;

  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, filteredList.length);
  const total = filteredList.length;

  let msg = `${start}–${end} of ${total} results`;

  if (currentQuery.trim()) {
    const desc = buildQueryDescription(currentQuery);
    if (desc) msg += ` for ${desc}`;
  }

  resultsMessage.textContent = msg;
}

function buildQueryDescription(query) {
  const terms = [];
  const fieldPattern = /(\w+):([^\s]+)/g;
  let match;

  while ((match = fieldPattern.exec(query)) !== null) {
    const [, rawField, rawValue] = match;
    const field = ALIAS[rawField.toLowerCase()] || rawField.toLowerCase();
    const value = rawValue.replace(/^"|"$/g, '');

    const prettyValue = prettyScalar(field, value);
    const fieldLabel = field.charAt(0).toUpperCase() + field.slice(1);
    terms.push(`${fieldLabel}: ${prettyValue}`);
  }

  return terms.join(', ');
}

export function setNoResults(show) {
  if (!noResultsEl) return;

  if (show) {
    noResultsEl.classList.remove('hidden');
    noResultsEl.style.opacity = '1';
  } else {
    noResultsEl.classList.add('hidden');
    noResultsEl.style.opacity = '0';
  }
}

export function renderNextPage(replace = false) {
  if (!cardGrid) return;

  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const slice = filteredList.slice(start, end);

  if (replace) {
    cardGrid.innerHTML = '';
  }

  const loadingStrategy = (page === 1) ? 'eager' : 'lazy';

  slice.forEach(card => {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.setAttribute('data-id', card.id);
    cardDiv.setAttribute('tabindex', '0');

    if (card.archetype === 'hq') {
      cardDiv.classList.add('is-hq');
      cardDiv.innerHTML = `
        <div class="card-rotator">
          <img src="${card.image}" alt="${card.title}" loading="${loadingStrategy}" decoding="async">
        </div>
      `;
    } else {
      cardDiv.innerHTML = `<img src="${card.image}" alt="${card.title}" loading="${loadingStrategy}" decoding="async">`;
    }

    cardGrid.appendChild(cardDiv);
  });

  animateCardsInRange(replace ? 0 : start);
  updateLoadUi();
  updateResultsMessage();
  preloadNextPage();
}

function preloadNextPage() {
  const oldLinks = document.querySelectorAll('link[data-card-prefetch]');
  oldLinks.forEach(link => link.remove());

  const nextStart = page * PAGE_SIZE;
  const nextEnd = nextStart + PAGE_SIZE;
  const nextSlice = filteredList.slice(nextStart, nextEnd);

  nextSlice.forEach(card => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = card.image;
    link.as = 'image';
    link.setAttribute('data-card-prefetch', 'true');
    document.head.appendChild(link);
  });
}

export function applyQuery(reset = true) {
  const input = document.getElementById('searchInputBar') || document.getElementById('searchInputHero');
  const query = input ? input.value : '';
  // If the query hasn't changed and we've already rendered once, skip redundant work
  if (hasRenderedOnce && query === currentQuery) {
    return;
  }
  currentQuery = query;
  // Fast path: empty query shows all cards
  if (!query || !query.trim()) {
    filteredList = cards.slice();
  } else {
    filteredList = cards.filter(card => matchCard(card, query));
  }

  if (reset) {
    page = 1;
  }

  if (filteredList.length === 0) {
    setNoResults(true);
    if (cardGrid) cardGrid.innerHTML = '';
    updateLoadUi();
  } else {
    setNoResults(false);
    applySortAndRender();
  }

  hasRenderedOnce = true;
}

export function updateLoadUi() {
  if (!loadWrap) return;

  const totalPages = Math.ceil(filteredList.length / PAGE_SIZE);
  const firstPageBtn = document.getElementById("firstPageBtn");
  const prevPageBtn = document.getElementById("prevPageBtn");
  const nextPageBtn = document.getElementById("nextPageBtn");
  const lastPageBtn = document.getElementById("lastPageBtn");
  const pageInfo = document.getElementById("pageInfo");

  if (totalPages <= 1) {
    loadWrap.classList.remove('visible');
    return;
  }

  loadWrap.classList.add('visible');

  if (firstPageBtn) firstPageBtn.disabled = page === 1;
  if (prevPageBtn) prevPageBtn.disabled = page === 1;
  if (nextPageBtn) nextPageBtn.disabled = page >= totalPages;
  if (lastPageBtn) lastPageBtn.disabled = page >= totalPages;

  if (pageInfo) {
    pageInfo.textContent = `Page ${page} of ${totalPages}`;
  }
}

function animateCardsInRange(startIndex = 0) {
  if (!cardGrid) return;
  const cards = cardGrid.querySelectorAll('.card');
  cards.forEach((card, i) => {
    if (i >= startIndex) {
      card.style.animationDelay = `${(i - startIndex) * 0.03}s`;
      card.classList.add('card-enter');
    }
  });
}

function scrollToCardGrid() {
  if (cardArea) {
    cardArea.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

export function goToPage(newPage) {
  const totalPages = Math.ceil(filteredList.length / PAGE_SIZE);
  if (newPage < 1 || newPage > totalPages) return;

  page = newPage;
  renderNextPage(true);
  scrollToCardGrid();
}

export function initCards() {
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      sortField = sortSelect.value;
      applySortAndRender();
    });
  }

  if (sortOrderBtn) {
    sortOrderBtn.addEventListener('click', () => {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      sortOrderBtn.classList.toggle('desc', sortOrder === 'desc');
      applySortAndRender();
    });
  }

  const heroInput = document.getElementById("searchInputHero");
  const barInput = document.getElementById("searchInputBar");

  // Debounce applyQuery to avoid flicker while typing
  const debouncedApply = (() => {
    let timer;
    return () => {
      clearTimeout(timer);
      timer = setTimeout(() => applyQuery(), 250);
    };
  })();

  if (heroInput) {
    heroInput.addEventListener('input', debouncedApply);
  }
  if (barInput) {
    barInput.addEventListener('input', debouncedApply);
  }

  // Pagination controls
  const firstPageBtn = document.getElementById("firstPageBtn");
  const prevPageBtn = document.getElementById("prevPageBtn");
  const nextPageBtn = document.getElementById("nextPageBtn");
  const lastPageBtn = document.getElementById("lastPageBtn");

  if (firstPageBtn) firstPageBtn.addEventListener("click", () => goToPage(1));
  if (prevPageBtn) prevPageBtn.addEventListener("click", () => goToPage(page - 1));
  if (nextPageBtn) nextPageBtn.addEventListener("click", () => goToPage(page + 1));
  if (lastPageBtn) {
    lastPageBtn.addEventListener("click", () => {
      const totalPages = Math.ceil(filteredList.length / PAGE_SIZE);
      goToPage(totalPages);
    });
  }

  // Jump to top button
  const jumpToTopBtn = document.getElementById("jumpToTop");
  if (jumpToTopBtn && cardArea) {
    function updateJumpToTopVisibility() {
      const snapContainer = document.querySelector('.snap-container');
      const scrolled = snapContainer ? snapContainer.scrollTop : cardArea.scrollTop;
      const threshold = 300;
      if (scrolled > threshold) {
        jumpToTopBtn.classList.remove('hidden');
      } else {
        jumpToTopBtn.classList.add('hidden');
      }
    }

    // Listen to both container and cardArea scrolling
    const snapContainer = document.querySelector('.snap-container');
    if (snapContainer) {
      snapContainer.addEventListener('scroll', updateJumpToTopVisibility, { passive: true });
    }
    cardArea.addEventListener('scroll', updateJumpToTopVisibility, { passive: true });

    jumpToTopBtn.addEventListener('click', () => {
      const snapContainer = document.querySelector('.snap-container');
      if (snapContainer) {
        snapContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
      // Also scroll card area to top
      cardArea.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}
