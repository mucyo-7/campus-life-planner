// Safe regex compiler — returns null on invalid pattern
export function compileRegex(input, caseSensitive = false) {
  if (!input || input.trim() === '') return null;
  try {
    const flags = caseSensitive ? '' : 'i';
    return new RegExp(input, flags);
  } catch {
    return null;
  }
}

// Highlight all regex matches in text using <mark>
export function highlight(text, re) {
  if (!re || !text) return escapeHtml(text || '');
  let result = '';
  let lastIndex = 0;
  const globalRe = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  let match;
  while ((match = globalRe.exec(text)) !== null) {
    result += escapeHtml(text.slice(lastIndex, match.index));
    result += `<mark>${escapeHtml(match[0])}</mark>`;
    lastIndex = globalRe.lastIndex;
    if (match[0].length === 0) { globalRe.lastIndex++; }
  }
  result += escapeHtml(text.slice(lastIndex));
  return result;
}

// Escape HTML special characters to prevent XSS
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Filter records by regex against title and tag
export function filterRecords(records, re) {
  if (!re) return records;
  return records.filter(r => re.test(r.title) || re.test(r.tag));
}