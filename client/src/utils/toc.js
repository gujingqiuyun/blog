export function extractTOC(markdown) {
  if (!markdown) return [];
  const headings = [];
  const lines = markdown.split('\n');
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      if (level > 2) continue; // only H1 and H2
      const text = match[2].replace(/[`*_~\[\]()]/g, '').trim();
      const id = text
        .toLowerCase()
        .replace(/[\s]+/g, '-')
        .replace(/[^\w一-鿿\-]/g, '')
        .replace(/-+$/g, '');
      headings.push({ level, text, id });
    }
  }
  return headings;
}

/** Build a tree: H1 nodes with H2 children */
export function buildTOCTree(headings) {
  const tree = [];
  let currentH1 = null;
  for (const h of headings) {
    if (h.level === 1) {
      currentH1 = { ...h, children: [] };
      tree.push(currentH1);
    } else if (h.level === 2 && currentH1) {
      currentH1.children.push(h);
    }
  }
  return tree;
}
