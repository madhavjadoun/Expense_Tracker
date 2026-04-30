// ─────────────────────────────────────────────────────────────
//  chatEngine.js
//  Fuzzy-aware FAQ matcher — handles:
//    1. Exact keyword match
//    2. Vowel-stripped match  (thnks → thanks, expnse → expense)
//    3. Levenshtein distance  (recieve → receive, mstke → mistake)
//    4. Prefix / substring    (exp → expense)
// ─────────────────────────────────────────────────────────────
import {
  FAQ_ITEMS,
  GREETING_TRIGGERS,
  CLOSING_TRIGGERS,
  GREETING_RESPONSE,
  CLOSING_RESPONSE,
  FALLBACK_RESPONSE,
} from "../data/helpData";

// ── Text utilities ────────────────────────────────────────────

/** Lowercase, strip punctuation, collapse whitespace */
function normalise(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Strip all vowels — gives consonant skeleton for phonetic matching */
function stripVowels(str) {
  return str.replace(/[aeiou]/gi, "");
}

/**
 * Levenshtein edit distance between two strings.
 * Returns the minimum number of single-character edits needed.
 */
function levenshtein(a, b) {
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  // Use a 1-D rolling array for memory efficiency
  let prev = Array.from({ length: lb + 1 }, (_, i) => i);
  for (let i = 1; i <= la; i++) {
    const curr = [i];
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,        // insert
        prev[j] + 1,            // delete
        prev[j - 1] + cost      // replace
      );
    }
    prev = curr;
  }
  return prev[lb];
}

/**
 * Fuzzy similarity score between two *words* (0 = no match, 1 = exact).
 * Combines four strategies with priority weighting.
 */
function wordSimilarity(queryWord, keywordWord) {
  // Too short to fuzzy-match reliably (avoid false positives)
  if (queryWord.length < 2 || keywordWord.length < 2) {
    return queryWord === keywordWord ? 1 : 0;
  }

  // 1. Exact match
  if (queryWord === keywordWord) return 1;

  // 2. One is a prefix of the other (min length 3)
  if (
    queryWord.length >= 3 &&
    (keywordWord.startsWith(queryWord) || queryWord.startsWith(keywordWord))
  ) return 0.85;

  // 3. Vowel-stripped skeleton match
  const qs = stripVowels(queryWord);
  const ks = stripVowels(keywordWord);
  if (qs.length >= 2 && ks.length >= 2 && qs === ks) return 0.8;

  // 4. Levenshtein — tolerance scales with word length
  const maxLen = Math.max(queryWord.length, keywordWord.length);
  const dist = levenshtein(queryWord, keywordWord);
  const tolerance = maxLen <= 4 ? 1 : maxLen <= 7 ? 2 : 3;
  if (dist <= tolerance) {
    // Score: 1 when dist=0, decreasing as dist grows
    return Math.max(0, 0.75 - dist * 0.15);
  }

  // 5. Vowel-stripped Levenshtein (handles combined missing vowels + typos)
  if (qs.length >= 2 && ks.length >= 2) {
    const skelDist = levenshtein(qs, ks);
    const skelTol = Math.max(1, Math.floor(ks.length / 3));
    if (skelDist <= skelTol) {
      return Math.max(0, 0.65 - skelDist * 0.12);
    }
  }

  return 0;
}

/**
 * Score a FAQ entry against the full normalised query.
 * Splits both into words and finds the best fuzzy alignment.
 * Returns 0–1.
 */
function scoreEntry(normQuery, keywords) {
  const queryWords = normQuery.split(" ").filter(Boolean);
  let totalHits = 0;

  for (const kw of keywords) {
    const kwNorm = normalise(kw);

    // Fast path: full keyword phrase is a substring of the query
    if (normQuery.includes(kwNorm)) {
      totalHits += 1;
      continue;
    }

    // Word-level fuzzy scoring
    const kwWords = kwNorm.split(" ").filter(Boolean);
    let kwScore = 0;

    for (const kWord of kwWords) {
      let bestWord = 0;
      for (const qWord of queryWords) {
        const s = wordSimilarity(qWord, kWord);
        if (s > bestWord) bestWord = s;
      }
      kwScore += bestWord;
    }

    const normScore = kwWords.length > 0 ? kwScore / kwWords.length : 0;
    if (normScore >= 0.5) totalHits += normScore;
  }

  return keywords.length > 0 ? totalHits / keywords.length : 0;
}

// ── Greeting / Closing fuzzy checks ──────────────────────────

function isGreeting(norm) {
  const words = norm.split(" ");
  return GREETING_TRIGGERS.some((g) => {
    const gn = normalise(g);
    return words.some((w) => wordSimilarity(w, gn) >= 0.75);
  });
}

function isClosing(norm) {
  return CLOSING_TRIGGERS.some((c) => {
    const cn = normalise(c);
    // Substring match OR fuzzy word match
    if (norm.includes(cn)) return true;
    return norm.split(" ").some((w) => wordSimilarity(w, cn) >= 0.75);
  });
}

// ── Main exported function ────────────────────────────────────

/**
 * Given a raw user message, returns the best answer string.
 * Handles: exact, fuzzy, vowel-stripped, abbreviated, typo-ridden queries.
 */
export function getAnswer(rawMessage) {
  const norm = normalise(rawMessage);

  // 1. Greeting
  if (isGreeting(norm)) return GREETING_RESPONSE;

  // 2. Closing
  if (isClosing(norm)) return CLOSING_RESPONSE;

  // 3. FAQ matching — pick highest-scored entry
  let best = null;
  let bestScore = 0;

  for (const entry of FAQ_ITEMS) {
    const score = scoreEntry(norm, entry.keywords);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  // Require at least a weak signal (≥ 0.08) to avoid random matches
  if (best && bestScore >= 0.08) {
    return best.answer;
  }

  return FALLBACK_RESPONSE;
}
