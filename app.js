/* ===== FULL-PAGE PARALLAX (slows near bottom) ===== */
const HERO = document.getElementById("hero");
const cardArea = document.getElementById("cardArea");

// Parallax parameters
const BASE_SPEED = 0.45;   // initial scroll strength
const SLOW_FACTOR = 0.5;   // how much it eases near bottom (0–1)
const snapContainer = document.querySelector('.snap-container');

function getTotalScroll(){
  const outer = snapContainer ? snapContainer.scrollTop : window.pageYOffset;
  const inner = document.getElementById('cardArea')?.scrollTop || 0;
  return outer + inner;
}

function getMaxScroll(){
  const outerMax = (snapContainer ? (snapContainer.scrollHeight - snapContainer.clientHeight)
                                  : (document.documentElement.scrollHeight - window.innerHeight));
  const innerMax = document.getElementById('cardArea')?.scrollHeight - document.getElementById('cardArea')?.clientHeight || 0;
  return Math.max(1, outerMax + innerMax);
}

function updateParallax() {
  const y = getTotalScroll();
  const p = Math.min(1, y / getMaxScroll());        // progress ratio 0..1
  const speed = BASE_SPEED * (1 - SLOW_FACTOR * p); // slows near bottom
  document.body.style.backgroundPosition = `center ${-(y * speed)}px`;
  document.body.style.setProperty("--grad-shift", `${-(y * speed * 0.5)}px`);
}

// make parallax react to section snapping too
(snapContainer || window).addEventListener('scroll', updateParallax, { passive:true });
updateParallax(); // set initial background position

(snapContainer || window).addEventListener('scroll', updateFades, { passive:true });
updateFades();

cardArea.addEventListener("scroll", updateParallax, { passive: true });

/* ===== FADE NO-RESULTS MESSAGE ON SCROLL UP ===== */
const noResults = document.getElementById("noResults");

(snapContainer || window).addEventListener("scroll", () => {
  if (!noResults || noResults.classList.contains("hidden")) return;

  const heroHeight = document.getElementById("hero").offsetHeight;
  const y = snapContainer ? snapContainer.scrollTop : window.scrollY;
  const progress = Math.min(1, y / heroHeight);

  const opacity = Math.max(0, Math.min(1, progress * 1.5)); // 0→1 as you leave hero
  noResults.style.opacity = opacity.toFixed(2);
  noResults.style.transform = `translateY(${(1 - opacity) * -20}px)`;
}, { passive: true });

/* crossfade bottom ↔ top gradient */
function updateFades(){
  const snap = document.querySelector('.snap-container');
  const outerY = snap ? snap.scrollTop : window.scrollY;
  const outerMax = (snap ? (snap.scrollHeight - snap.clientHeight)
                         : (document.documentElement.scrollHeight - window.innerHeight));

  const progress = outerMax > 0 ? outerY / outerMax : 0; // 0..1
  // start crossfade around ~30% of the way down
  const start = 0.30, end = 0.80;
  const t = Math.min(1, Math.max(0, (progress - start) / (end - start)));

  const topOpacity = t;           // 0 → 1
  const bottomOpacity = 1 - t;    // 1 → 0

  document.body.style.setProperty('--top-fade-opacity', topOpacity.toFixed(3));
  document.body.style.setProperty('--bottom-fade-opacity', bottomOpacity.toFixed(3));
}

/* ===== STICKY TOPBAR ===== */
const topbar = document.getElementById("topbar");

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) topbar.classList.add('sticky');
    else topbar.classList.remove('sticky');
  });
}, { root: snapContainer || null, threshold: 0.01 });
observer.observe(HERO);

/* ===== SEARCH SYNC (hero ↔ topbar) ===== */
const heroInput = document.getElementById("searchInputHero");
const barInput  = document.getElementById("searchInputBar");

function syncInputs(from, to) {
  to.value = from.value;
  applyQuery(true);
}

function debounce(fn, delay = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
const debouncedSync = debounce((from, to) => syncInputs(from, to), 300);

heroInput.addEventListener("input", () => debouncedSync(heroInput, barInput));
barInput.addEventListener("input", () => debouncedSync(barInput, heroInput));

/* ===== HERO SEARCH FORCES DOWNWARD ===== */
function goDown(){
  if (!snapContainer) return;
  // scroll exactly one screen down (to the card interface) using custom animator
  smoothScrollTo(window.innerHeight, SNAP_DURATION);
}

function focusTopbarAfterSnap() {
  const targetY = window.innerHeight;            // second section

  const check = () => {
    const y = snapContainer ? snapContainer.scrollTop : window.scrollY;
    if (Math.abs(y - targetY) < 2) {
      barInput.focus();          // move caret to top bar
      heroInput.readOnly = false; // re-enable typing
      return;
    }
    requestAnimationFrame(check);
  };
  requestAnimationFrame(check);
}

/* ===== ENTER HANDLER FOR BOTH SEARCH BARS ===== */
function handleEnter(e, sourceInput, targetInput, scrollDown = false) {
  if (e.key !== "Enter") return;
  e.preventDefault();

  // Temporarily disable both inputs to block typing mid-snap
  heroInput.readOnly = true;
  barInput.readOnly = true;

  // Exit typing mode
  sourceInput.blur();

  if (scrollDown && snapContainer) {
    // Scroll down from hero to card interface with custom speed/easing
    smoothScrollTo(window.innerHeight, SNAP_DURATION);
  }

  // Wait until snap is roughly finished before re-enabling
  setTimeout(() => {
    heroInput.readOnly = false;
    barInput.readOnly = false;
    if (scrollDown) targetInput.focus();
  }, 800); // keep roughly aligned with SNAP_DURATION
}

/* Hero: scrolls down + exits typing */
heroInput.addEventListener("keydown", e =>
  handleEnter(e, heroInput, barInput, true)
);
/* Topbar: just exits typing (no scroll) */
barInput.addEventListener("keydown", e =>
  handleEnter(e, barInput, heroInput, false)
);

/* ===== BUTTON ACTIONS ===== */
function openAdvanced() {
  alert("🔍 Advanced Search coming soon!");
}
/* ===== OPEN / CLOSE SYNTAX GUIDE ===== */
function openSyntaxGuide() {
  document.getElementById("syntaxModal").classList.remove("hidden");
}

document.getElementById("closeSyntax").addEventListener("click", () => {
  document.getElementById("syntaxModal").classList.add("hidden");
});

document.getElementById("syntaxModal").addEventListener("click", e => {
  if (e.target.id === "syntaxModal") {
    document.getElementById("syntaxModal").classList.add("hidden");
  }
});

function openRandom() {
  const pool = cards;
  if (!pool.length) return;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  if (pick) openModal(pick.id);
}

[
  ["advancedBtn", openAdvanced],
  ["syntaxBtn", openSyntaxGuide],
  ["randomBtn", openRandom],
  ["advancedBtnTop", openAdvanced],
  ["syntaxBtnTop", openSyntaxGuide],
  ["randomBtnTop", openRandom],
].forEach(([id, fn]) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("click", fn);
});

/* ===== CARD DATA + RENDER ===== */
const cardGrid = document.getElementById("cardGrid");
const modal = document.getElementById("modal");
const closeModal = document.getElementById("closeModal");
let cards = [];

/* === FIELD ALIASES & ENUMS (type-aware) === */
const ALIAS = {
  // names
  n: "title", name: "title", title: "title",

  // core kinds
  t: "type", type: "type",                      // tarot | hq | kingdom | favor | tactic
  f: "faction", faction: "faction",             // clans | uprising | gathering | nobility

  // tarot-only
  a: "archetype", archetype: "archetype",
  tr: "traits", trait: "traits", traits: "traits",
  str: "strength", strength: "strength",
  v: "votes", votes: "votes",
  l: "lore", lore: "lore",
  c: "cost", cost: "cost",                      // advanced tarot

  // kingdom-only
  s: "suit", suit: "suit",                      // swords | book | coins

  // text boxes
  cmd: "commands", commands: "commands",
  r: "rules", rules: "rules", oracle: "rules",
  fl: "flavor", flavor: "flavor",

  // release / tags
  set: "release", exp: "release", module: "release", release: "release",
  tag: "tags", tags: "tags",
  has: "has", is: "is"
};

const ENUMS = {
  type:      ["tarot","hq","kingdom","favor","tactic"],
  faction:   ["clans","uprising","gathering","nobility"],
  suit:      ["swords","book","coins"],
  archetype: ["ruse","trader","follower","agent","cavalry","war machine","machine","captain","heir","champion"],
  traits:    ["resilient","invulnerable","pathfinder"]
};

function inType(card, t){ return String(card.type||"").toLowerCase() === t; }
function hasAny(val){ return Array.isArray(val) ? val.length>0 : (val!=null && String(val).trim()!==""); }
function norm(s){ return String(s||"").toLowerCase(); }
function matchesEnum(field, value){
  const list = ENUMS[field] || null;
  if (!list) return true;
  const v = norm(value);
  return list.some(x => x === v);
}

/* ========= ADVANCED QUERY ENGINE ========= */
const NUMERIC_KEYS = new Set(["cost","strength","votes","lore"]);
const TEXT_KEYS = ["title","type","faction","archetype","traits","suit","commands","rules","flavor","release","tags"];

// Tokenize: parentheses, OR, fielded tokens, quoted phrases, bare terms
function tokenizeQuery(q) {
  const re = /(\(|\)|\bOR\b|-?\w+(?::[<>]=?|=)?[^()\s]+|"[^"]+"|-?\S+)/gi;
  const out = [];
  let m;
  while ((m = re.exec(q))) out.push(m[0]);
  return out;
}

// Turn tokens into an AST with OR precedence
function parseTokens(tokens) {
  const out = [];
  while (tokens.length) {
    const t = tokens.shift();
    if (t === ")") break;
    if (t === "(") { out.push(parseTokens(tokens)); continue; }
    if (/^OR$/i.test(t)) out.push({type:"op", op:"OR"});
    else if (t.startsWith("-")) out.push({type:"term", neg:true, raw:t.slice(1)});
    else out.push({type:"term", neg:false, raw:t});
  }
  // group by OR (AND is default)
  const groups = [];
  let cur = [];
  for (const x of out) {
    if (x.type==="op" && x.op==="OR") { groups.push(cur); cur = []; }
    else cur.push(x);
  }
  if (cur.length) groups.push(cur);
  if (groups.length > 1) return { op:"OR", terms: groups.map(g => ({ op:"AND", terms: g.map(parseLeaf) })) };
  return { op:"AND", terms: out.map(parseLeaf) };
}

function parseLeaf(x){
  if (x.op || x.terms) return x;
  if (x.type !== "term") return x;
  const m = x.raw.match(/^(\w+):([<>]=?|=)?(.+)$/);
  let key, op, val;
  if (m) {
    [ , key, op, val ] = m;
    val = val.replace(/^"|"$/g, "");
  } else {
    key = null; op = ":"; val = x.raw.replace(/^"|"$/g, "");
  }
  return { type:"term", neg:x.neg, key: key ? (ALIAS[key.toLowerCase()] || key.toLowerCase()) : null, op: op || ":", val };
}

function evalNode(card, node){
  if (!node) return true;
  if (node.op === "AND") return node.terms.every(t => evalNode(card, t));
  if (node.op === "OR")  return node.terms.some(t => evalNode(card, t));
  if (node.type === "term") return matchTerm(card, node);
  return true;
}

function matchTerm(card, term){
  const { key, op, val, neg } = term;
  let ok = true;

  // Unfielded → search title + rules + commands
  if (!key) {
    const hay = (String(card.title||"") + " " + (card.rules||"") + " " + (card.commands||"")).toLowerCase();
    ok = hay.includes(val.toLowerCase());
    return neg ? !ok : ok;
  }

  // presence: has:field
  if (key === "has") {
    const f = (ALIAS[val] || val).toLowerCase();
    const v = f === "tags" ? (card.tags||[]) :
              f === "text" ? (card.rules||"")+(card.commands||"")+(card.flavor||"") :
              card[f];
    ok = hasAny(v);
    return neg ? !ok : ok;
  }

  // derived sugar
  if (key === "is") {
    const flag = norm(val);
    if (flag === "vanilla") ok = !hasAny(card.rules) && !hasAny(card.commands);
    else if (flag === "legendary") ok = /legendary/i.test(card.title||"") || /legendary/i.test((card.traits||[]).join(" "));
    else ok = false;
    return neg ? !ok : ok;
  }

  // release blob (expansion/module/basegame keywords)
  if (key === "release") {
    const blob = [
      card.release?.expansion || "",
      card.release?.module || "",
      card.release?.basegame ? "basegame" : ""
    ].join(" ").toLowerCase();
    ok = textCompare(blob, val);
    return neg ? !ok : ok;
  }

  // tags list
  if (key === "tags") {
    const tags = (card.tags||[]).map(norm);
    ok = tags.some(t => textCompare(t, val));
    return neg ? !ok : ok;
  }

  // === TYPE-GATED FIELDS ===
  if (["archetype","traits","strength","votes","lore","cost"].includes(key)) {
    if (!inType(card,"tarot")) return neg ? true : false;
  }
  if (key === "suit") {
    if (!inType(card,"kingdom")) return neg ? true : false;
  }

  // enums (type/faction/suit/archetype/traits)
  if (key in ENUMS) {
    ok = matchesEnum(key, val) && textCompare(norm(card[key]), val);
    return neg ? !ok : ok;
  }

  // numeric
  if (NUMERIC_KEYS.has(key)) {
    const n = Number(card[key]);
    ok = compareNum(n, op, val);
    return neg ? !ok : ok;
  }

  // text
  const fieldVal = key === "traits"
    ? (card.traits||[]).map(norm).join(" ")
    : norm(card[key]);
  ok = textCompare(fieldVal, val);
  return neg ? !ok : ok;
}

function contains(hay, needle){
  return String(hay || "").toLowerCase().includes(String(needle || "").toLowerCase());
}

function compareNum(n, op, rhs){
  if (rhs.includes("..")) {
    const [aStr, bStr] = rhs.split("..");
    const a = Number(aStr), b = Number(bStr);
    if ([a,b,n].some(Number.isNaN)) return false;
    return n >= Math.min(a,b) && n <= Math.max(a,b);
  }
  const num = Number(rhs.replace(/[^\d.-]/g,""));
  if (Number.isNaN(n) || Number.isNaN(num)) return false;
  switch (op) {
    case "=":  return n === num;
    case "!=": return n !== num;
    case ">":  return n >  num;
    case ">=": return n >= num;
    case "<":  return n <  num;
    case "<=": return n <= num;
    default:   return n === num; // fallback
  }
}

function textCompare(fieldVal, pattern){
  if (pattern === "*") return String(fieldVal).trim() !== "";
  // wildcards * and ? to regex (match anywhere)
  const esc = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\\*/g, ".*")
    .replace(/\\\?/g, ".");
  const re = new RegExp(esc, "i");
  return re.test(fieldVal);
}

/* Public: matchCard() consumed by applyQuery() */
function matchCard(card, rawQuery){
  const q = (rawQuery || "").trim();
  if (!q) return true;
  const ast = parseTokens(tokenizeQuery(q));
  return evalNode(card, ast);
}

/* ===== PAGINATED CARD RENDER ===== */
let page = 1;
const PAGE_SIZE = 28;
let currentQuery = "";
let filteredList = [];

// references for UI bits
const loadWrap = document.querySelector('.load-more-wrapper');
const noResultsEl = document.getElementById('noResults');

// helper used by applyQuery()
function setNoResults(show) {
  if (!noResultsEl) return;
  noResultsEl.classList.toggle('hidden', !show);
  if (show) {
    noResultsEl.style.opacity = '1';
    noResultsEl.style.transform = 'translateY(0)';
  }
}

/* Renders the visible batch of cards */
function renderNextPage() {
  const total = filteredList.length;
  const start = (page - 1) * PAGE_SIZE;
  const end   = Math.min(page * PAGE_SIZE, total);
  const slice = filteredList.slice(start, end);

  const html = slice.map(c => `
    <div class="card" data-id="${c.id}" role="button" tabindex="0" aria-label="${c.title||''}">
      <img src="${c.image}" alt="${c.name || ''}" loading="lazy">
    </div>
  `).join("");

  cardGrid.insertAdjacentHTML("beforeend", html);
  if (typeof animateCardsInRange === "function") animateCardsInRange(start);
}

/* Filter cards for current query and reset pagination */
function applyQuery(reset = true) {
  const q = (barInput.value || heroInput.value || "").trim();
  const query = q.toLowerCase();

  try {
    filteredList = cards.filter(c =>
      !query || (typeof matchCard === "function" ? matchCard(c, query) : true)
    );
  } catch {
    filteredList = cards.filter(c => !query || String(c.name||"").toLowerCase().includes(query));
  }

  page = 1;
  cardGrid.innerHTML = "";

  if (filteredList.length === 0) {
    setNoResults(true);
    updateLoadUi();
    return;
  }

  setNoResults(false);
  renderNextPage();
  updateLoadUi();
}

/* Manage the button visibility */
function updateLoadUi() {
  const total = filteredList.length;
  const shown = Math.min(page * PAGE_SIZE, total);
  const remaining = Math.max(0, total - shown);

  if (!loadWrap || !loadBtn) return;

  if (remaining > 0) {
    loadWrap.style.display = "flex";
    loadBtn.disabled = false;
    loadBtn.textContent = `Next ${Math.min(PAGE_SIZE, remaining)}`;
  } else {
    loadWrap.style.display = "none";
    loadBtn.disabled = true;
  }
}

/* ===== CARD ANIMATION HELPERS ===== */

function animateCardsOut(callback) {
  const all = Array.from(cardGrid.querySelectorAll('.card'));
  if (!all.length) return callback?.();

  const STAGGER = 40; // ms between each fade-out (top to bottom)
  all.forEach((el, i) => {
    el.style.animationDelay = `${i * STAGGER}ms`;
    el.classList.add('card-exit');
  });

  const totalDuration = all.length * STAGGER + 400; // animation length + stagger
  setTimeout(() => {
    cardGrid.innerHTML = '';
    callback?.();
  }, totalDuration);
}

/* Animate only the newly-added cards starting at startIndex */
function animateCardsInRange(startIndex = 0) {
  const all = Array.from(cardGrid.querySelectorAll(".card"));
  const newOnes = all.slice(startIndex);
  const STAGGER = 60;

  newOnes.forEach(el => {
    el.classList.remove("card-enter", "card-leave", "card-exit");
    el.style.animation = "none";
    el.offsetHeight;
    el.style.animation = "";
    el.style.animationDelay = "0ms";
  });

  newOnes.forEach((el, i) => {
    el.style.animationDelay = `${i * STAGGER}ms`;
    el.classList.add("card-enter");
  });
}

/* Smooth replace with stable order + correct targeting of new cards only */
function renderWithLeave(nextSlice) {
  const nextIds = new Set(nextSlice.map(c => String(c.id)));

  const currentNodes = Array.from(cardGrid.querySelectorAll(".card"));
  currentNodes.forEach((el) => {
    if (!nextIds.has(el.dataset.id)) {
      el.classList.remove("card-enter");
      el.classList.add("card-leave");
      el.addEventListener("animationend", () => el.remove(), { once: true });
    }
  });

  const byId = new Map(
    Array.from(cardGrid.querySelectorAll(".card")).map(el => [el.dataset.id, el])
  );

  const frag = document.createDocumentFragment();
  const newNodes = [];

  nextSlice.forEach((c) => {
    const id = String(c.id);
    const existing = byId.get(id);
    if (existing) {
      existing.classList.remove("card-enter", "card-leave", "card-exit");
      existing.style.animation = "";
      frag.appendChild(existing);
    } else {
      const node = document.createElement("div");
      node.className = "card";
      node.dataset.id = id;
      node.innerHTML = `
        <img src="${c.image}" alt="">
        <h3>${c.name}</h3>
        <p>${c.text || c.rules || ""}</p>
      `;
      node.dataset.new = "1";
      frag.appendChild(node);
      newNodes.push(node);
    }
  });

  cardGrid.appendChild(frag);

  const STAGGER = 60;
  newNodes.forEach((el, i) => {
    el.classList.remove("card-enter", "card-leave", "card-exit");
    el.style.animation = "none";
    el.offsetHeight;
    el.style.animation = "";
    el.style.animationDelay = `${i * STAGGER}ms`;
    el.classList.add("card-enter");
    delete el.dataset.new;
  });
}

/* ===== LOAD MORE BUTTON ===== */
const loadBtn = document.getElementById("loadMoreBtn");
loadBtn.addEventListener("click", () => {
  page++;
  renderNextPage();
});

/* ===== CARD STAGGER ANIMATION ===== */
function animateCardsIn() {
  const cardsEls = Array.from(cardGrid.querySelectorAll('.card'));
  const cols = getComputedStyle(cardGrid)
    .gridTemplateColumns.split(' ').length || 1;

  const STAGGER = 70; // ms delay per card

  cardsEls.forEach(el => {
    el.classList.remove('card-enter');
    el.style.animationDelay = '0ms';
    el.offsetHeight;
  });

  cardsEls.forEach((el, i) => {
    const delay = i * STAGGER;
    el.style.animationDelay = `${delay}ms`;
    el.classList.add('card-enter');
  });
}

// Open the modal when a grid card is clicked (event delegation)
cardGrid.addEventListener('click', (e) => {
  const el = e.target.closest('.card');
  if (!el) return;
  openModal(el.dataset.id);
});

cardGrid.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const el = e.target.closest('.card');
  if (!el) return;
  openModal(el.dataset.id);
});

/* ===== MODAL (single definition) ===== */
function openModal(id) {
  const c = cards.find(x => String(x.id) === String(id));
  if (!c) return;

  modal.style.display = "flex";
  document.body.classList.add('lock-scroll'); // optional scroll lock

  const art     = document.getElementById("modalArt");
  const nameEl  = document.getElementById("modalName");
  const metaEl  = document.getElementById("modalMeta");
  const cmdEl   = document.getElementById("modalCmd");
  const rulesEl = document.getElementById("modalRules");
  const flavEl  = document.getElementById("modalFlavor");

  art.src = c.image || "";
  art.alt = c.title || "";
  nameEl.textContent = c.title || "";

  const relBits = [
    c.release?.basegame ? "Base Game" : "",
    c.release?.expansion || "",
    c.release?.module || ""
  ].filter(Boolean).join(" — ");

  const powerBits = [
    c.cost != null ? `Cost ${c.cost}` : "",
    c.strength != null ? `STR ${c.strength}` : "",
    c.votes != null ? `Votes ${c.votes}` : "",
    c.lore != null ? `Lore ${c.lore}` : ""
  ].filter(Boolean).join(" • ");

  const metaBits = [
    [c.type, c.faction].filter(Boolean).join(" • "),
    powerBits,
    relBits ? `Release: ${relBits}` : ""
  ].filter(Boolean).join(" • ");

  metaEl.textContent  = metaBits;
  cmdEl.textContent   = c.commands || "";
  rulesEl.textContent = c.rules || "";
  flavEl.textContent  = c.flavor || "";
}

// --- modal close (outside click, button, ESC) ---
function dismissModal() {
  modal.style.display = 'none';
  document.body.classList.remove('lock-scroll');
}

modal.addEventListener('click', (e) => {
  const clickedBackdrop = e.target === modal || e.target.id === 'modalContent';
  const inside = e.target.closest('.modal-inner');
  if (clickedBackdrop || !inside) dismissModal();
});

document.querySelector('#modalContent .modal-inner')
  ?.addEventListener('click', (e) => e.stopPropagation());

closeModal.addEventListener('click', dismissModal);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') dismissModal();
});

/* ===== SNAP TIMING ===== */
const SNAP_DURATION = 900; // ms — change to taste

// Cancellable, ease-in-out scroll with exact settle at the end
let __scrollAnimId = 0;
function smoothScrollTo(targetY, duration = SNAP_DURATION) {
  const startId = ++__scrollAnimId;                // cancel previous anims
  const startY = snapContainer.scrollTop;
  const dist   = targetY - startY;
  const t0     = performance.now();

  function easeInOutCubic(t) {
    return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2;
  }

  function frame(now) {
    if (startId !== __scrollAnimId) return;        // cancelled
    const t = Math.min((now - t0) / duration, 1);
    const eased = easeInOutCubic(t);
    snapContainer.scrollTop = startY + dist * eased;
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ===== CUSTOM SNAP SMOOTH SCROLL ===== */
if (snapContainer) {
  // one set of snap state + helpers
  let isSnapping = false;
  let justUnlockedUntil = 0;
  const PAGE = () => window.innerHeight;
  const clampToPage = (y) => Math.round(y / PAGE()) * PAGE();

  function lock(){ isSnapping = true; }
  function unlock(){
    isSnapping = false;
    justUnlockedUntil = performance.now() + 80; // absorb residual wheel for 80ms
  }

  // Wait until we land, then hard-set to exact and unlock
  function releaseWhenSettled(targetYExact) {
    const check = () => {
      const y = snapContainer.scrollTop;
      if (Math.abs(y - targetYExact) < 1) {
        snapContainer.scrollTop = targetYExact; // pixel-perfect alignment
        setTimeout(unlock, 40);                 // let OS momentum finish
        return;
      }
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }

  function snapTo(yTarget) {
    const exact = clampToPage(yTarget);
    lock();
    __scrollAnimId++;               // cancel any in-flight animation
    smoothScrollTo(exact, SNAP_DURATION);
    releaseWhenSettled(exact);
  }

  // Helpers for the inner grid
  const grid = document.getElementById("cardArea");
  const atTop    = () => grid.scrollTop <= 0;
  const atBottom = () => grid.scrollTop + grid.clientHeight >= grid.scrollHeight - 1;

  // === Wheel (trackpad/mouse) handler ===
  snapContainer.addEventListener("wheel", (e) => {
    const now = performance.now();

    // Block during snap and brief cooldown
    if (isSnapping || now < justUnlockedUntil) {
      e.preventDefault();
      return;
    }

    const overGrid = grid.contains(e.target);
    const up   = e.deltaY < 0;
    const down = e.deltaY > 0;

    // ===== INSIDE CARD GRID =====
    if (overGrid) {
      // Mid-grid → scroll up: first glide grid to top, then snap to previous page
      if (up && !atTop()) {
        e.preventDefault();
        lock();
        grid.scrollTo({ top: 0, behavior: "smooth" });
        const wait = () => {
          if (atTop()) {
            snapTo(snapContainer.scrollTop - PAGE());
          } else {
            requestAnimationFrame(wait);
          }
        };
        requestAnimationFrame(wait);
        return;
      }

      // At top of grid → scroll up goes to previous page
      if (up && atTop()) {
        e.preventDefault();
        snapTo(snapContainer.scrollTop - PAGE());
        return;
      }

      // At bottom of grid → scroll down goes to next page
      if (down && atBottom()) {
        e.preventDefault();
        snapTo(snapContainer.scrollTop + PAGE());
        return;
      }

      // Otherwise let the grid scroll normally
      return;
    }

    // ===== OUTSIDE GRID (Hero section, etc.) =====
    const mod = snapContainer.scrollTop % PAGE();
    const aligned = Math.abs(mod) < 1 || Math.abs(mod - PAGE()) < 1;

    // Only snap when already aligned on a page boundary
    if (aligned) {
      e.preventDefault();
      snapTo(snapContainer.scrollTop + (down ? +PAGE() : -PAGE()));
    }
  }, { passive: false });
}

/* ===== LOAD CARDS FROM data.json (with normalization + fallback) ===== */
const DATA_PATHS = ["data.json", "data/data.json"]; // try root first, then /data/

function normalizeCard(raw, idx) {
  const c = { ...raw };

  c.id     = String(c.id ?? `X${idx + 1}`);
  c.title  = String(c.title ?? c.name ?? "Unknown Card");
  c.image  = String(c.image ?? "images/placeholder.jpg");

  ["type","faction","archetype","suit","commands","rules","flavor"].forEach(k => {
    if (c[k] != null) c[k] = String(c[k]);
  });

  if (!Array.isArray(c.traits)) c.traits = c.traits ? String(c.traits).split(/\s*,\s*/) : [];
  if (!Array.isArray(c.tags))   c.tags   = c.tags   ? String(c.tags).split(/\s*,\s*/)   : [];

  ["cost","strength","votes","lore"].forEach(k => {
    if (c[k] != null && c[k] !== "") c[k] = Number(c[k]);
  });

  return c;
}

/* ===== LOAD CARDS (robust) ===== */
async function loadCards() {
  const paths = ["data.json", "data/data.json"]; // try both
  let data = null;

  for (const p of paths) {
    try {
      const res = await fetch(`${p}?v=${Date.now()}`);
      if (!res.ok) continue;
      data = await res.json();
      break;
    } catch (_) {}
  }

  if (!Array.isArray(data) || data.length === 0) {
    console.warn("[OKC] No data.json found or empty; using placeholders");
    data = Array.from({ length: 90 }, (_, i) => ({
      id: `P${i + 1}`,
      name: `Placeholder ${i + 1}`,
      type: "Unit",
      faction: "Crown",
      text: "Test card for parallax and scrolling.",
      image: "images/placeholder.jpg"
    }));
  }

  cards = data.map(normalizeCard);
  applyQuery(true);
  console.log("[OKC] cards loaded:", cards.length);
}

loadCards();