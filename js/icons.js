/* =========================================================
   Icons & Token Rendering Module
   - Icon token replacement
   - Inline formatting
   ========================================================= */

export const COLOR_ICONS = new Set([
  "<autumn>", "<day>", "<winter>", "<spring>", "<night>"
]);

const iconEntry = (name, extraCls = "") => {
  const path = `images/iconography/svg/${name}.svg`;
  const isColor = COLOR_ICONS.has(`<${name}>`);
  const cls = isColor ? 'icon icon--img' : 'icon icon--mask';
  return [
    `<${name}>`,
    `<span class="${cls} ${extraCls}" style="--icon-path: url('${path}')"></span>`
  ];
};

export const ICONS = Object.fromEntries([
  iconEntry("day", "icon--phase"),
  iconEntry("night", "icon--phase"),
  iconEntry("spring", "icon--phase"),
  iconEntry("autumn", "icon--phase"),
  iconEntry("winter", "icon--phase"),
  iconEntry("swords"),
  iconEntry("book"),
  iconEntry("coins"),
  iconEntry("clans"),
  iconEntry("uprising"),
  iconEntry("gathering"),
  iconEntry("nobility"),
  iconEntry("hq"),
  iconEntry("kingdom"),
  iconEntry("favour"),
  iconEntry("agent", "icon--arch"),
  iconEntry("captain", "icon--arch"),
  iconEntry("cavalry", "icon--arch"),
  iconEntry("champion", "icon--arch"),
  iconEntry("follower", "icon--arch"),
  iconEntry("heir", "icon--arch"),
  iconEntry("machine", "icon--arch"),
  iconEntry("ruse", "icon--arch"),
  iconEntry("trader", "icon--arch"),
  iconEntry("resilient"),
  iconEntry("invulnerable"),
  iconEntry("pathfinder"),
  iconEntry("cost"),
  iconEntry("votes"),
  iconEntry("lore"),
  iconEntry("influence"),
  iconEntry("sim"),
]);

export function renderIconToken(token) {
  const html = ICONS[token];
  if (html) {
    return COLOR_ICONS.has(token) ? html : html;
  }
  return token;
}

export function iconLabel(tokenName, text) {
  const iconHtml = renderIconToken(tokenName);
  return `${iconHtml} <span>${text}</span>`;
}

export function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function applyInlineFormatting(s) {
  let result = s;
  const boldRegex = /b:([^<\s]+(?:\s+[^<\s]+)*?)(?=\s|$|<)/g;
  result = result.replace(boldRegex, (match, content) => {
    return `<strong>${content}</strong>`;
  });
  return result;
}

export function injectIconsToHTML(value) {
  if (Array.isArray(value)) {
    return value.map(line => injectIconsToHTML(line)).join('<br>');
  }
  let text = String(value || '');
  text = normalizeTimingSyntax(text);
  text = escapeHtml(text);
  Object.keys(ICONS).forEach(token => {
    const escaped = token.replace(/[<>]/g, c => c === '<' ? '&lt;' : '&gt;');
    const iconHtml = ICONS[token];
    text = text.split(escaped).join(iconHtml);
  });
  text = applyInlineFormatting(text);
  return text;
}

export function normalizeTimingSyntax(text) {
  const lines = text.split('\n');
  const normalized = lines.map(line => {
    const match = line.match(/^(day|night|spring|autumn|winter):\s*/i);
    if (match) {
      const timing = match[1].toLowerCase();
      return line.replace(match[0], `<${timing}> `);
    }
    return line;
  });
  return normalized.join('\n');
}

export function normalizeParagraphs(val) {
  if (Array.isArray(val)) {
    return val.map(line => injectIconsToHTML(line)).join('<br>');
  }
  const text = String(val || '');
  const paragraphs = text.split(/\n\n+/);
  return paragraphs.map(p => `<p>${injectIconsToHTML(p.trim())}</p>`).join('');
}

export function renderCommandsBlock(lines) {
  if (!lines || (Array.isArray(lines) && lines.length === 0)) return '';
  const arr = Array.isArray(lines) ? lines : [lines];
  const items = arr.map(line => `<div>${injectIconsToHTML(line)}</div>`);
  return items.join('<div class="or-line">OR</div>');
}

export function renderRulesBlock(text) {
  if (!text) return '';
  const lines = text.split('\n').filter(l => l.trim());
  const result = [];
  
  for (const line of lines) {
    const match = line.match(/^<(\w+)>\s*(.*)/);
    if (match) {
      const [, token, rest] = match;
      const iconHtml = renderIconToken(`<${token}>`);
      result.push(`
        <div class="rule-with-tag">
          <div class="rule-tag">${iconHtml}</div>
          <div class="rule-text">${injectIconsToHTML(rest)}</div>
        </div>
      `);
    } else {
      result.push(`<div class="rule-text">${injectIconsToHTML(line)}</div>`);
    }
  }
  
  return result.join('');
}
