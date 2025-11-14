/* =========================================================
   Labels & Formatting Module
   - Pretty labels for all card fields
   - Formatting helpers
   ========================================================= */

export const TYPE_LABELS = {
  basic: "Basic Faction Card",
  advanced: "Advanced Faction Card",
  kingdom: "Kingdom Card",
  favour: "Kingdom's Favour Ability",
  tactic: "Tactic"
};

export const FACTION_LABELS = {
  clans: "The Clans",
  uprising: "The Uprising",
  gathering: "The Gathering",
  nobility: "The Nobility"
};

export const SUIT_LABELS = {
  swords: "Swords",
  book: "Book",
  coins: "Coins"
};

export const ARCHETYPE_LABELS = {
  ruse: "Ruse",
  trader: "Trader",
  follower: "Follower",
  agent: "Agent",
  cavalry: "Cavalry",
  machine: "War Machine",
  captain: "Captain",
  heir: "Heir",
  champion: "Champion",
  hq: "HQ Card"
};

export const TRAIT_LABELS = {
  resilient: "Resilient",
  invulnerable: "Invulnerable",
  pathfinder: "Pathfinder"
};

export const RELEASE_EXPANSION_LABELS = {};
export const RELEASE_MODULE_LABELS = {};

export function titleCase(s) {
  return String(s).replace(/\w\S*/g, txt =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

export function prettyScalar(key, value) {
  const v = String(value).toLowerCase();
  switch (key) {
    case 'type': return TYPE_LABELS[v] || titleCase(value);
    case 'faction': return FACTION_LABELS[v] || titleCase(value);
    case 'suit': return SUIT_LABELS[v] || titleCase(value);
    case 'archetype': return ARCHETYPE_LABELS[v] || titleCase(value);
    case 'traits': return TRAIT_LABELS[v] || titleCase(value);
    case 'release':
      return RELEASE_EXPANSION_LABELS[v] || RELEASE_MODULE_LABELS[v] || titleCase(value);
    default: return titleCase(value);
  }
}

export function prettyArray(key, arr, sep = ", ") {
  if (!Array.isArray(arr)) return '';
  return arr.map(item => prettyScalar(key, item)).join(sep);
}

export function prettyRelease(rel) {
  if (!rel) return '';
  if (typeof rel === 'string') return titleCase(rel);
  if (typeof rel === 'object') {
    if (rel.basegame) return 'Base Game';
    const parts = [];
    if (rel.expansion) parts.push(RELEASE_EXPANSION_LABELS[rel.expansion] || titleCase(rel.expansion));
    if (rel.module) parts.push(RELEASE_MODULE_LABELS[rel.module] || titleCase(rel.module));
    return parts.join(' — ') || 'Unknown';
  }
  return '';
}

export function prettyPowerBits(card) {
  const parts = [];
  if (card.cost != null) parts.push(`Cost: ${card.cost}`);
  if (card.strength != null) parts.push(`Strength: ${card.strength}`);
  if (card.votes != null) parts.push(`Votes: ${card.votes}`);
  if (card.lore != null) parts.push(`Lore: ${card.lore}`);
  return parts.join(' • ');
}
