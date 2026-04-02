// Common French words that are unlikely to be English
// Used as a heuristic to detect French-language pages
const FRENCH_INDICATORS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'en', 'est',
  'que', 'qui', 'dans', 'pour', 'pas', 'sur', 'plus', 'ce', 'ne', 'se',
  'avec', 'sont', 'mais', 'ou', 'par', 'cette', 'nous', 'vous', 'ils',
  'elle', 'son', 'tout', 'aussi', 'fait', 'comme', 'ont', 'bien', 'aux',
  'peut', 'entre', 'faire', 'leurs', 'donc', 'ces', 'sans', 'sous',
  'etre', 'avoir', 'dit', 'elle', 'tous', 'meme', 'apres', 'tres',
  'autre', 'quand', 'chez', 'encore', 'depuis', 'alors', 'notre',
  'ainsi', 'avant', 'votre', 'jour', 'deux', 'ans',
]);

// Words with French-specific characters are almost certainly French
// Unicode escapes for French-specific characters to keep bundle ASCII-clean
const FRENCH_CHAR_PATTERN = /[\u00e0\u00e2\u00e4\u00e9\u00e8\u00ea\u00eb\u00ef\u00ee\u00f4\u00f9\u00fb\u00fc\u00ff\u00e7\u0153\u00e6]/;

// Common English words to exclude from highlighting
const ENGLISH_COMMON = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
  'her', 'was', 'one', 'our', 'out', 'has', 'his', 'how', 'its', 'may',
  'new', 'now', 'old', 'see', 'way', 'who', 'did', 'get', 'let', 'say',
  'she', 'too', 'use', 'him', 'man', 'day', 'any', 'why', 'few', 'got',
  'own', 'each', 'make', 'like', 'long', 'look', 'many', 'some', 'them',
  'than', 'been', 'have', 'from', 'into', 'just', 'over', 'such', 'take',
  'with', 'year', 'they', 'this', 'that', 'what', 'when', 'will', 'time',
  'very', 'your', 'come', 'could', 'about', 'would', 'there', 'their',
  'which', 'other', 'after', 'first', 'also', 'back', 'more', 'work',
]);

/**
 * Detect if a page is primarily French by sampling text content.
 * Returns a confidence score 0-1.
 */
export function detectFrenchPage(): number {
  const text = document.body?.innerText?.toLowerCase() ?? '';
  const words = text.split(/\s+/).filter((w) => w.length >= 2);
  if (words.length < 20) return 0;

  const sample = words.slice(0, 500);
  let frenchScore = 0;

  for (const word of sample) {
    if (FRENCH_INDICATORS.has(word)) frenchScore++;
    if (FRENCH_CHAR_PATTERN.test(word)) frenchScore += 2;
  }

  return Math.min(1, frenchScore / (sample.length * 0.15));
}

/**
 * Check if a word is likely French (not common English).
 */
export function isLikelyFrench(word: string): boolean {
  const lower = word.toLowerCase();
  if (lower.length < 3) return false;
  if (ENGLISH_COMMON.has(lower)) return false;
  if (FRENCH_CHAR_PATTERN.test(lower)) return true;
  // On a confirmed French page, accept all non-English words
  return true;
}

export { FRENCH_CHAR_PATTERN, ENGLISH_COMMON };
