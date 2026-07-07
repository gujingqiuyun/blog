/**
 * Find headings in markdown with their line numbers and IDs.
 * Returns [{ line, id }] where id is the DOM element id in the preview.
 */
export function getHeadingPositions(markdown) {
  const headings = [];
  const lines = markdown.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,3})\s+(.+)$/);
    if (!m) continue;
    const text = m[2].replace(/[`*_~\[\]()]/g, '').trim();
    const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w一-鿿\-]/g, '').replace(/-+$/g, '');
    headings.push({ line: i, id });
  }
  return headings;
}

/**
 * Given scrollTop of a textarea, estimate the current line number
 * and find the nearest heading above it.
 * Returns the heading's DOM element id.
 */
export function getCurrentHeadingId(scrollTop, textarea, markdown) {
  const headings = getHeadingPositions(markdown);
  if (!headings.length) return null;
  // Estimate line height: scrollHeight / total lines
  const totalLines = markdown.split('\n').length;
  const lineH = textarea.scrollHeight / totalLines;
  const currentLine = Math.floor(scrollTop / lineH);
  // Find the last heading that starts before currentLine
  let active = headings[0];
  for (const h of headings) {
    if (h.line <= currentLine) active = h;
    else break;
  }
  return active.id;
}
