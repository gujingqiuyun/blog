export function extractTOC(markdown) {
  if (!markdown) return [];
  const headings = [];
  const lines = markdown.split('\n');
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const text = match[2].replace(/[`*_~\[\]()]/g, '').trim();
      const id = text
        .toLowerCase()
        .replace(/[\s]+/g, '-')
        .replace(/[^\w一-鿿\-]/g, '')
        .replace(/-+$/g, '');
      headings.push({ level: match[1].length, text, id });
    }
  }
  return headings;
}
