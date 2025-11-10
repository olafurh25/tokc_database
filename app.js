/* =========================================================
   Old King's Crown — UI & Search
   - Parallax + fades
   - Search + query engine
   - Grid rendering + pagination
   - Modal rendering
   - Data loading/normalization
   ========================================================= */

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
  const el = document.getElementById('cardArea');
  const innerMax = el ? (el.scrollHeight - el.clientHeight) : 0;
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

  const opacity = Math.max(0, Math.min(1, progress * 1.5)); 
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
  alert("🔍 Advanced Search Engine coming soon!");
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

/* ===== TOPBAR LOGO → SNAP TO HERO ===== */
const logoEl = document.querySelector('.topbar-logo');
if (logoEl) {
  logoEl.setAttribute('role', 'button');
  logoEl.setAttribute('aria-label', 'Go to hero');
  logoEl.tabIndex = 0;

  const goHero = (e) => {
    if (!snapContainer) return;
    e?.preventDefault?.();
    smoothScrollTo(0, SNAP_DURATION);
  };

  logoEl.addEventListener('click', goHero);
  logoEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') goHero(e);
  });
}

/* ===== CARD DATA + RENDER ===== */
const cardGrid = document.getElementById("cardGrid");
const modal = document.getElementById("modal");
let cards = [];

/* === FIELD ALIASES & ENUMS (type-aware) === */
const ALIAS = {
  // names
  n: "title", name: "title", title: "title",

  // core kinds
  t: "type", type: "type",                      // tarot | hq | kingdom | favor | tactic TODO: forge, ambition, scheme, threat
  f: "faction", faction: "faction",             // clans | uprising | gathering | nobility TODO: simulacrum

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
  type:      ["basic","advanced","hq","kingdom","favour","tactic"],
  faction:   ["clans","uprising","gathering","nobility"],
  suit:      ["swords","book","coins"],
  archetype: ["ruse","trader","follower","agent","cavalry","war machine","machine","captain","heir","champion"],
  traits:    ["resilient","invulnerable","pathfinder"]
};

// both "basic" and "advanced" are faction cards
const isFactionCard = (card) => {
  const t = String(card.type || "").toLowerCase();
  return t === "basic" || t === "advanced";
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
  const cmdText = Array.isArray(card.commands) ? card.commands.join(" ") : (card.commands||"");
  const hay = (String(card.title||"") + " " + (card.rules||"") + " " + cmdText).toLowerCase();
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

  if (["archetype","traits","strength","votes","lore"].includes(key)) {
    if (!isFactionCard(card)) return neg ? true : false;
  }

  if (key === "suit") {
    if (!inType(card,"kingdom")) return neg ? true : false;
  }

  if (key === "type") {
    const v = String(val).toLowerCase();
    let ok;
    if (v === "faction") {
      ok = isFactionCard(card); // matches both Basic/Advanced Faction Card
    } else {
      ok = matchesEnum("type", val) && textCompare(norm(card.type), val);
    }
    return neg ? !ok : ok;
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

// ---- No-results popup control ----
function setNoResults(show) {
  const el = noResultsEl;
  if (!el) return;
  el.classList.toggle('hidden', !show);
  if (show) {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  } else {
    el.style.opacity = '';
    el.style.transform = '';
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

/* ===== PRETTY LABELS (hardcoded for every field) ===== */

// Maps for exact, human-pretty labels.
const TYPE_LABELS = {
  basic: "Basic Faction Card",
  advanced: "Advanced Faction Card",
  hq: "HQ Card",
  kingdom: "Kingdom Card",
  favour: "Kingdom's Favour Ability",
  tactic: "Tactic"
};

const FACTION_LABELS = {
  clans: "The Clans",
  uprising: "The Uprising",
  gathering: "The Gathering",
  nobility: "The Nobility"
};

const SUIT_LABELS = {
  swords: "Swords",
  book: "Book",
  coins: "Coins"
};

const ARCHETYPE_LABELS = {
  ruse: "Ruse",
  trader: "Trader",
  follower: "Follower",
  agent: "Agent",
  cavalry: "Cavalry",
  machine: "War Machine",
  captain: "Captain",
  heir: "Heir",
  champion: "Champion"
};

const TRAIT_LABELS = {
  resilient: "Resilient",
  invulnerable: "Invulnerable",
  pathfinder: "Pathfinder"
};

// Map expansion modules here

// Unknown values fall back to Title Case.
const RELEASE_EXPANSION_LABELS = {
  // "wild_kingdom": "Wild Kingdom",
};
const RELEASE_MODULE_LABELS = {
  // "winter_rules": "Winter Rules",
};

// ---------- Formatting helpers ----------

// Title-Case fallback for any unknown string.
function titleCase(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\b([a-z])/g, (m, c) => c.toUpperCase());
}

// Returns a pretty, hardcoded label for a single scalar value by key.
// If not found in a map, falls back to Title Case.
function prettyScalar(key, value) {
  if (value == null || value === "") return "";
  const v = String(value).toLowerCase();

  switch (key) {
    case "type":       return TYPE_LABELS[v]       || titleCase(value);
    case "faction":    return FACTION_LABELS[v]    || titleCase(value);
    case "suit":       return SUIT_LABELS[v]       || titleCase(value);
    case "archetype":  return ARCHETYPE_LABELS[v]  || titleCase(value);
    case "trait":      return TRAIT_LABELS[v]      || titleCase(value);
    case "tags":       return titleCase(value);
    case "releaseExpansion":
      return RELEASE_EXPANSION_LABELS[v] || titleCase(value);
    case "releaseModule":
      return RELEASE_MODULE_LABELS[v] || titleCase(value);
    default:
      return titleCase(value);
  }
}

// Pretty print arrays (traits, tags) using the scalar map per item.
function prettyArray(key, arr, sep = ", ") {
  if (!Array.isArray(arr) || arr.length === 0) return "";
  return arr.map(v =>
    prettyScalar(key === "traits" ? "trait" : key, v)
  ).join(sep);
}

function prettyRelease(rel) {
  if (!rel) return "";

  // Treat any truthy `basegame` as Base Game, and ignore module if set.
  if (rel.basegame) return "Release: Base Game";

  // Otherwise, show Expansion and (optionally) Module.
  const bits = [];
  if (rel.expansion && String(rel.expansion).trim()) {
    bits.push(prettyScalar("releaseExpansion", rel.expansion));
  }
  if (rel.module && String(rel.module).trim()) {
    bits.push(prettyScalar("releaseModule", rel.module));
  }

  return bits.length ? `Release: ${bits.join(" — ")}` : "";
}


// Numbers/power line
function prettyPowerBits(card) {
  const out = [];
  if (card.cost != null)      out.push(`Cost ${card.cost}`);
  if (card.strength != null)  out.push(`Strength ${card.strength}`);
  if (card.votes != null)     out.push(`Votes ${card.votes}`);
  if (card.lore != null)      out.push(`Lore ${card.lore}`);
  return out.join(" ⬩ ");
}

/* ===== TOKEN → ICONS (SVG) ===== */

// any tokens to keep in full color (emoji-style)
const COLOR_ICONS = new Set([
  "<autumn>", "<day>", "<winter>", "<spring>", "<night>"   
]);

// helper to define one entry
const iconEntry = (name, extraCls = "") => {
  const token = `<${name}>`;
  const path  = `images/iconography/svg/${name}.svg`;
  const isColor = COLOR_ICONS.has(token);
  return [token, { mode: isColor ? "img" : "mask", path, cls: extraCls }];
};

// master map
const ICONS = Object.fromEntries([
  // phases / seasons
  iconEntry("day", "icon--phase"),
  iconEntry("night", "icon--phase"),
  iconEntry("spring", "icon--phase"),
  iconEntry("autumn", "icon--phase"),
  iconEntry("winter", "icon--phase"),

  // suits
  iconEntry("swords"),
  iconEntry("book"),
  iconEntry("coins"),

  // factions / card types
  iconEntry("clans"),
  iconEntry("uprising"),
  iconEntry("gathering"),
  iconEntry("nobility"),
  iconEntry("hq"),
  iconEntry("kingdom"),
  iconEntry("favour"),

  // archetypes
  iconEntry("agent","icon--arch"),
  iconEntry("captain","icon--arch"),
  iconEntry("cavalry","icon--arch"),
  iconEntry("champion","icon--arch"),
  iconEntry("follower","icon--arch"),
  iconEntry("heir","icon--arch"),
  iconEntry("machine","icon--arch"),
  iconEntry("ruse","icon--arch"),
  iconEntry("trader","icon--arch"),

  // traits
  iconEntry("resilient"),
  iconEntry("invulnerable"),
  iconEntry("pathfinder"),

  // stats / symbols
  iconEntry("cost"),
  iconEntry("votes"),
  iconEntry("lore"),
  iconEntry("influence"),

  // misc you uploaded
  iconEntry("sim"),
]);

// ---- Paragraph helpers ----
function normalizeParagraphs(val) {
  if (Array.isArray(val)) {
    return val.map(s => String(s).trim()).filter(Boolean);
  }
  const s = String(val || "").replace(/\r\n/g, "\n").trim();
  if (!s) return [];
  // split by blank lines → paragraphs
  return s.split(/\n{2,}/).map(p => p.trim());
}

function renderCommandsBlock(lines) {
  // normalize to array of trimmed lines
  const arr = Array.isArray(lines) ? lines : String(lines || "").split(/\n+/);
  const html = arr.map(raw => {
    const s = String(raw).trim();
    if (!s) return "";
    if (/^or$/i.test(s)) {
      return `<div class="or-line">OR</div>`;
    }
    // inject icons into this one command line only
    return `<div class="cmd-line">${injectIconsToHTML(normalizeTimingSyntax(s))}</div>`;
  }).join("");
  return html;
}

function renderIconToken(token) {
  const meta = ICONS[token];
  if (!meta) return token; // passthrough
  if (meta.mode === "img") {
    // full-color image (keeps its own fills/gradients)
    return `<img class="icon icon--img ${meta.cls||""}" src="${meta.path}" alt="${token.replace(/[<>]/g,'')}" />`;
  }
  // text-colored via CSS mask (inherits currentColor)
  return `<span class="icon icon--mask ${meta.cls||""}" style="--icon:url('${meta.path}');" aria-hidden="true"></span>`;
}

/* Render rules with a leading tag pulled out as a big left icon */
function renderRulesBlock(text) {
  // normalize "day:" → "<day>" etc., then work with a string
  const normalized = normalizeTimingSyntax(text);
  const s = Array.isArray(normalized) ? normalized.join("\n") : String(normalized || "");

  // look for a leading tag that matches our ICONS (e.g., "<day>")
  const m = s.match(/^\s*(<[^>]+>)/);
  const token = m && m[1];

  if (token && ICONS[token]) {
    // left icon (2x) + full text (icons injected) to the right
    const iconHTML = renderIconToken(token);
    const rest = s.slice(m[0].length).replace(/^\s+/, "");

    return `
      <div class="rule-with-tag">
        <div class="rule-tag">${iconHTML}</div>
        <div class="rule-text">${injectIconsToHTML(rest)}</div>
      </div>
    `;
  }

  // no leading tag → just inject icons normally
  return injectIconsToHTML(s);
}

/* Icon + text inline, using existing ICONS + renderIconToken() */
function iconLabel(tokenName, text) {
  const token = `<${String(tokenName).toLowerCase()}>`;
  const icon = ICONS[token] ? renderIconToken(token) : "";
  return `<span class="meta-iconlabel">${icon}<span class="meta-labeltext">${text}</span></span>`;
}

/* Replace known tokens in strings; tolerate arrays in data.json */
function injectIconsToHTML(value) {
  if (value == null) return "";
  const s = Array.isArray(value) ? value.join("\n") : String(value);
  let out = s;

  // wrap any line that's exactly "OR" (case-insensitive) for styling
  out = out.replace(/^\s*or\s*$/gim, '<span class="or-line">OR</span>');


  // then inject icons
  for (const tok of Object.keys(ICONS)) {
    out = out.split(tok).join(renderIconToken(tok));
  }

  return out;
}

/* Optional: convert bare timing at line start into tokens (e.g., 'day:' → '<day>') */
function normalizeTimingSyntax(text) {
  if (!text) return text;
  const s = Array.isArray(text) ? text.join("\n") : String(text);
  return s
    .replace(/(^|\n)\s*day:/gi,    m => m.replace(/day:/i,    "<day>"))
    .replace(/(^|\n)\s*night:/gi,  m => m.replace(/night:/i,  "<night>"))
    .replace(/(^|\n)\s*spring:/gi, m => m.replace(/spring:/i, "<spring>"))
    .replace(/(^|\n)\s*autumn:/gi, m => m.replace(/autumn:/i, "<autumn>"))
    .replace(/(^|\n)\s*winter:/gi, m => m.replace(/winter:/i, "<winter>"));
}

/* ===== MODAL (single definition, with hardcoded pretty labels) ===== */
function openModal(id) {
  const c = cards.find(x => String(x.id) === String(id));
  if (!c) return;

  modal.style.display = "flex";
  document.body.classList.add('lock-scroll'); // optional scroll lock

  const art     = document.getElementById("modalArt");
  const nameEl  = document.getElementById("modalName");
  const metaEl  = document.getElementById("modalMeta");
  const typeFactionEl = document.getElementById("modalTypeFaction");
  const cmdEl   = document.getElementById("modalCmd");
  const rulesEl = document.getElementById("modalRules");
  const flavEl  = document.getElementById("modalFlavor");
  const votesEl = document.getElementById("metaVotes");
  const loreEl  = document.getElementById("metaLore");
  const relEl   = document.getElementById("metaRelease");

  // Art + title
  art.src = c.image || "";
  art.alt = c.title || "";
  nameEl.textContent = c.title || "";

  // === Type + Faction/Suit (top header row, right-aligned) ===

  // Pretty text values
  const typeHeader    = prettyScalar("type", c.type);
  const factionHeader = prettyScalar("faction", c.faction);
  const suitHeader   = prettyScalar("suit", c.suit);

  // Add icons for specific card types
  // (HQ → hq.svg, Favour → favour.svg, Kingdom → kingdom.svg)
  let typeWithIcon = typeHeader;
  if (c.type === "hq")       typeWithIcon = iconLabel("hq", typeHeader);
  if (c.type === "favour")   typeWithIcon = iconLabel("favour", typeHeader);
  if (c.type === "kingdom")  typeWithIcon = iconLabel("kingdom", typeHeader);

  // Right-side label: use suit for Kingdoms, faction for everything else
  let rightLabel = "";
  if (c.type === "kingdom" && c.suit) {
    rightLabel = iconLabel(c.suit, suitHeader);
  } else if (c.faction) {
    rightLabel = iconLabel(c.faction, factionHeader);
  }

  // Combine and inject into the header container
  typeFactionEl.innerHTML = [typeWithIcon, rightLabel].filter(Boolean).join(" ⬩ ");


  // ---- Body texts ----
  // normalize bare "day:" / "night:" at line starts to tokens, then inject icons
  cmdEl.innerHTML = renderCommandsBlock(c.commands);
  // rules: big leading tag on left (if present)
  rulesEl.innerHTML = renderRulesBlock(c.rules);
  // after computing metaBits:
  // ==== TOP META (separate lines, with icons for faction / cost / archetype / traits) ====
  const typePretty      = prettyScalar("type", c.type);

  // faction (with icon) — works with clans/uprising/gathering/nobility
  const factionPretty   = c.faction
    ? iconLabel(c.faction, prettyScalar("faction", c.faction))
    : "";

  // strength
  const strengthPretty  = (c.strength != null) ? `Strength ${c.strength}` : "";

  // cost (with icon)
  const costPretty      = (c.cost != null) ? iconLabel("cost", `Cost ${c.cost}`) : "";

  // archetype (with icon) — heir/cavalry/captain/etc.
  const archetypePretty = c.archetype
    ? iconLabel(c.archetype, prettyScalar("archetype", c.archetype))
    : "";

  // traits (each with its own icon)
  const traitsPretty = (Array.isArray(c.traits) && c.traits.length)
    ? c.traits.map(t => iconLabel(t, prettyScalar("trait", t))).join(" ⬩ ")
    : "";

  // line 1: Type ⬥ Faction
  let metaHTML = "";

  // line 2: Strength ⬥ Cost
  const powerLine = [strengthPretty, costPretty].filter(Boolean).join(" ⬩ ");
  if (powerLine) metaHTML += `<br>${powerLine}`;

  // line 3: Archetype
  if (archetypePretty) metaHTML += `<br>${archetypePretty}`;

  // line 4: Traits
  if (traitsPretty) metaHTML += `<br>${traitsPretty}`;

  metaEl.innerHTML = metaHTML;
  flavEl.textContent  = c.flavor || "";
  // Stats row: show diamond only if both exist
  const votesHTML = (c.votes != null) ? iconLabel("votes", `Votes ${c.votes}`) : "";
  const loreHTML  = (c.lore  != null)  ? iconLabel("lore",  `Lore ${c.lore}`)  : "";

  if (votesHTML && loreHTML) {
    document.getElementById("metaStats").innerHTML = `${votesHTML} ⬩ ${loreHTML}`;
  } else {
    document.getElementById("metaStats").innerHTML = votesHTML || loreHTML;
  }

  relEl.textContent = prettyRelease(c.release);
}


// --- modal close (outside click, button, ESC) ---
function dismissModal() {
  modal.style.display = 'none';
  document.body.classList.remove('lock-scroll');
}

// Close modal when clicking anywhere on the screen
modal.addEventListener('click', dismissModal);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') dismissModal();
});

/* ===== SNAP TIMING ===== */
const SNAP_DURATION = 750;

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
    if (startId !== __scrollAnimId) return;        
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
    justUnlockedUntil = performance.now() + 250; // absorb residual wheel for ~1/4s
  }

  // Wait until we land, then hard-set to exact and unlock
  function releaseWhenSettled(targetYExact) {
    const check = () => {
      const y = snapContainer.scrollTop;
      if (Math.abs(y - targetYExact) < 1) {
        snapContainer.scrollTop = targetYExact; // pixel-perfect alignment
        setTimeout(unlock, 120);                // let OS momentum finish
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

    // Page math
    const pageH   = PAGE();
    const maxPage = Math.max(
      0,
      Math.floor((snapContainer.scrollHeight - snapContainer.clientHeight) / pageH)
    );
    const curPage = Math.round(snapContainer.scrollTop / pageH);

    // ===== INSIDE CARD GRID =====
    if (overGrid) {
      // Only snap if we're at an edge and there's a page to move to
      if (up && atTop()) {
        if (curPage > 0) {
          e.preventDefault();
          snapTo((curPage - 1) * pageH);
        }
        return;
      }

      if (down && atBottom()) {
        if (curPage < maxPage) {
          e.preventDefault();
          snapTo((curPage + 1) * pageH);
        }
        return;
      }

      // Otherwise: normal grid scrolling
      return;
    }

    // ===== OUTSIDE GRID (Hero section, etc.) =====
    // Only snap when already aligned on a page boundary
    const mod = snapContainer.scrollTop % pageH;
    const aligned = Math.abs(mod) < 1 || Math.abs(mod - pageH) < 1;

    if (aligned) {
      const next = curPage + (down ? 1 : -1);
      // Don’t intercept if moving past bounds
      if (next < 0 || next > maxPage) return;

      e.preventDefault();
      snapTo(next * pageH);
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
  c.rules = normalizeParagraphs(c.rules);

  // keep scalar text fields as strings (NOT commands)
  ["type","faction","archetype","suit","rules","flavor"].forEach(k => {
    if (c[k] != null) c[k] = String(c[k]);
  });

  // normalize commands → always an array of lines
  if (c.commands == null || c.commands === "") {
    c.commands = [];
  } else if (Array.isArray(c.commands)) {
    c.commands = c.commands.map(s => String(s).trim()).filter(Boolean);
  } else {
    const s = String(c.commands);
    c.commands = s.split(/[\n,]+/).map(x => x.trim()).filter(Boolean);
  }


  if (!Array.isArray(c.traits)) c.traits = c.traits ? String(c.traits).split(/\s*,\s*/) : [];
  if (!Array.isArray(c.tags))   c.tags   = c.tags   ? String(c.tags).split(/\s*,\s*/)   : [];

  ["cost","strength","votes","lore"].forEach(k => {
    if (c[k] != null && c[k] !== "") c[k] = Number(c[k]);
  });

  return c;
}

/* ===== LOAD CARDS (robust) ===== */
async function loadCards() {
  const paths = ["data.json", "data/data.json"];
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
