export function getReadingStats(markdown) {
  if (!markdown) return { totalWords: 0, readingTime: 1, codeLines: 0 };

  // Split by code blocks, keep only text
  const textParts = markdown.split(/```[\s\S]*?```/g);
  const text = textParts.join(' ');

  // Count Chinese characters
  const chineseChars = (text.match(/[一-鿿㐀-䶿]/g) || []).length;

  // Count English words (exclude Chinese chars, split by whitespace)
  const englishWords = text
    .replace(/[一-鿿㐀-䶿]/g, ' ')
    .split(/\s+/)
    .filter(w => /[a-zA-Z0-9]/.test(w)).length;

  // Count code lines
  const codeBlocks = markdown.match(/```[\s\S]*?```/g) || [];
  let codeLines = 0;
  codeBlocks.forEach(block => {
    const lines = block.split('\n');
    codeLines += Math.max(0, lines.length - 2); // exclude ``` markers
  });

  const totalWords = chineseChars + englishWords;
  const readingTime = Math.max(1, Math.ceil(chineseChars / 300 + englishWords / 200));

  return { totalWords, readingTime, codeLines };
}
