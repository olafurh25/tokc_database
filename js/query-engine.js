/* =========================================================
   Query Engine Module
   - Advanced search parsing
   - Card matching logic
   - Field aliases and enums
   - Fuzzy matching for typos
   ========================================================= */

// Levenshtein distance for fuzzy matching
function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Calculate similarity percentage
function similarity(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(a, b);
  return 1 - (distance / maxLen);
}

// Find best fuzzy match for a word (70% threshold - very forgiving)
export function findFuzzyMatch(word, candidates, threshold = 0.7) {
  const normalized = norm(word);
  let bestMatch = null;
  let bestScore = 0;
  
  for (const candidate of candidates) {
    const score = similarity(normalized, norm(candidate));
    if (score >= threshold && score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }
  
  return bestMatch;
}

// Correct query with fuzzy matching
export function correctQuery(query, allCards = []) {
  // Build a list of all known words
  const knownWords = new Set();
  
  // Add all enum values
  Object.values(ENUMS).forEach(values => {
    values.forEach(v => knownWords.add(norm(v)));
  });
  
  // Add all field names and aliases
  Object.keys(ALIAS).forEach(k => knownWords.add(norm(k)));
  Object.values(ALIAS).forEach(v => knownWords.add(norm(v)));
  
  // Add card titles and common words from card data
  if (allCards && allCards.length > 0) {
    allCards.forEach(card => {
      if (card.title) {
        // Add individual words from titles
        norm(card.title).split(/\s+/).forEach(word => {
          if (word.length > 2) knownWords.add(word);
        });
      }
    });
  }
  
  // Parse and correct the query
  const tokens = query.split(/\s+/);
  const corrected = tokens.map(token => {
    // Skip operators and special characters
    if (['OR', 'AND', '(', ')'].includes(token) || token.startsWith('-') || token.startsWith('"')) {
      return token;
    }
    
    // Check if it's a field:value pattern
    if (token.includes(':')) {
      const [field, ...valueParts] = token.split(':');
      const value = valueParts.join(':');
      
      // Try to correct the field name
      const fieldMatch = findFuzzyMatch(field, [...Object.keys(ALIAS), ...Object.values(ALIAS)]);
      const correctedField = fieldMatch || field;
      
      // Try to correct the value if it's an enum
      const canonicalField = ALIAS[norm(correctedField)] || norm(correctedField);
      if (ENUMS[canonicalField]) {
        const valueMatch = findFuzzyMatch(value, ENUMS[canonicalField]);
        const correctedValue = valueMatch || value;
        return `${correctedField}:${correctedValue}`;
      }
      
      return `${correctedField}:${value}`;
    }
    
    // Try to correct standalone words against all known words
    const match = findFuzzyMatch(token, Array.from(knownWords));
    return match || token;
  });
  
  return corrected.join(' ');
}

export const ALIAS = {
  n: "title", name: "title", title: "title",
  t: "type", type: "type",
  f: "faction", faction: "faction",
  a: "archetype", archetype: "archetype", arch: "archetype",
  tr: "traits", trait: "traits", traits: "traits",
  str: "strength", strength: "strength",
  v: "votes", votes: "votes",
  l: "lore", lore: "lore",
  c: "cost", cost: "cost",
  s: "suit", suit: "suit",
  cmd: "commands", commands: "commands",
  r: "rules", rules: "rules", oracle: "rules",
  fl: "flavour", flavour: "flavour",
  set: "release", exp: "release", module: "release", release: "release", rel: "release",
  tag: "tags", tags: "tags",
  has: "has", is: "is"
};

export const ENUMS = {
  type: ["basic", "advanced", "kingdom", "favour", "tactic"],
  faction: ["clans", "uprising", "gathering", "nobility", "aeronauts", "simulacrum"],
  suit: ["swords", "book", "coins"],
  archetype: ["hq", "ruse", "trader", "follower", "agent", "cavalry", "war machine", "machine", "captain", "heir", "champion"],
  traits: ["resilient", "invulnerable", "pathfinder"]
};

export const NUMERIC_KEYS = new Set(["cost", "strength", "votes", "lore"]);
export const TEXT_KEYS = ["title", "type", "faction", "archetype", "traits", "suit", "commands", "rules", "flavour", "release", "tags"];

const isFactionCard = (card) => {
  return card.type === 'basic' || card.type === 'advanced';
};

function inType(card, t) {
  return card.type === t || (t === 'faction' && isFactionCard(card));
}

function hasAny(val) {
  return val !== null && val !== undefined && val !== '';
}

function norm(s) {
  return String(s || '').toLowerCase();
}

function matchesEnum(field, value) {
  const list = ENUMS[field];
  if (!list) return false;
  return list.some(e => norm(e) === norm(value));
}

function tokenizeQuery(q) {
  const re = /\(|\)|OR|-?"[^"]*"|-?[\w:*?]+(?:(?:=|!=|>=|<=|>|<)[^\s)]+)?|\.{2,}/g;
  const tokens = [];
  let m;
  while ((m = re.exec(q))) tokens.push(m[0]);
  return tokens;
}

function parseTokens(tokens) {
  const parseOr = () => {
    const left = parseAnd();
    while (tokens.length && tokens[0] === 'OR') {
      tokens.shift();
      const right = parseAnd();
      return { op: 'OR', left, right };
    }
    return left;
  };

  const parseAnd = () => {
    const terms = [];
    while (tokens.length && tokens[0] !== ')' && tokens[0] !== 'OR') {
      if (tokens[0] === '(') {
        tokens.shift();
        terms.push(parseOr());
        if (tokens[0] === ')') tokens.shift();
      } else {
        terms.push(parseLeaf(tokens.shift()));
      }
    }
    return terms.length === 1 ? terms[0] : { op: 'AND', terms };
  };

  return parseOr();
}

function parseLeaf(x) {
  const negate = x.startsWith('-');
  const str = negate ? x.slice(1) : x;
  let val = str.replace(/^"|"$/g, '');
  if (val.includes(':')) {
    const [fieldRaw, ...rest] = val.split(':');
    const field = ALIAS[fieldRaw.toLowerCase()] || fieldRaw.toLowerCase();
    val = rest.join(':');
  }
  return { negate, term: str.replace(/^"|"$/g, '') };
}

function evalNode(card, node) {
  if (node.op === 'OR') return evalNode(card, node.left) || evalNode(card, node.right);
  if (node.op === 'AND') return node.terms.every(t => evalNode(card, t));
  const match = matchTerm(card, node.term);
  return node.negate ? !match : match;
}

function matchTerm(card, term) {
  if (!term.includes(':')) {
    const pattern = term.toLowerCase();
    const titleMatch = contains(card.title || '', pattern);
    const rulesMatch = contains(card.rules || '', pattern);
    const commandsMatch = contains(Array.isArray(card.commands) ? card.commands.join(' ') : (card.commands || ''), pattern);
    return titleMatch || rulesMatch || commandsMatch;
  }

  const colonIndex = term.indexOf(':');
  const fieldRaw = term.slice(0, colonIndex).toLowerCase();
  const field = ALIAS[fieldRaw] || fieldRaw;
  let value = term.slice(colonIndex + 1).trim();

  if (field === 'has') {
    const subField = ALIAS[value.toLowerCase()] || value.toLowerCase();
    return hasAny(card[subField]);
  }

  if (field === 'is') {
    if (value === 'vanilla') {
      const noRules = !card.rules || card.rules === '';
      const noCommands = !card.commands || (Array.isArray(card.commands) && card.commands.length === 0) || card.commands === '';
      return noRules && noCommands;
    }
    if (value === 'legendary') {
      return contains(card.title || '', 'legendary') || (card.traits && card.traits.some(t => contains(t, 'legendary')));
    }
    return false;
  }

  const cardValue = card[field];
  if (cardValue === null || cardValue === undefined) return false;

  if (NUMERIC_KEYS.has(field)) {
    const num = typeof cardValue === 'number' ? cardValue : parseFloat(cardValue);
    if (isNaN(num)) return false;

    const opMatch = value.match(/^(=|!=|>=|<=|>|<)?(.+)$/);
    if (!opMatch) return false;
    const [, op = '=', rhs] = opMatch;

    if (rhs.includes('..')) {
      const [minStr, maxStr] = rhs.split('..');
      const min = parseFloat(minStr);
      const max = parseFloat(maxStr);
      return !isNaN(min) && !isNaN(max) && num >= min && num <= max;
    }

    return compareNum(num, op, rhs);
  }

  if (field === 'release') {
    const rel = card.release;
    if (typeof rel === 'object' && rel !== null) {
      if (rel.basegame && contains('basegame', value)) return true;
      if (rel.expansion && contains(rel.expansion, value)) return true;
      if (rel.module && contains(rel.module, value)) return true;
    }
    return false;
  }

  if (Array.isArray(cardValue)) {
    return cardValue.some(item => textCompare(item, value));
  }

  return textCompare(String(cardValue), value);
}

function contains(hay, needle) {
  return norm(hay).includes(norm(needle));
}

function compareNum(n, op, rhs) {
  const target = parseFloat(rhs);
  if (isNaN(target)) return false;
  switch (op) {
    case '=': return n === target;
    case '!=': return n !== target;
    case '>': return n > target;
    case '>=': return n >= target;
    case '<': return n < target;
    case '<=': return n <= target;
    default: return false;
  }
}

function textCompare(fieldVal, pattern) {
  const fv = norm(fieldVal);
  const pv = norm(pattern);
  if (pv.includes('*') || pv.includes('?')) {
    const regexPattern = '^' + pv.replace(/\*/g, '.*').replace(/\?/g, '.') + '$';
    return new RegExp(regexPattern).test(fv);
  }
  return fv.includes(pv);
}

export function matchCard(card, rawQuery) {
  if (!rawQuery.trim()) return true;
  const tokens = tokenizeQuery(rawQuery);
  const ast = parseTokens(tokens);
  return evalNode(card, ast);
}
