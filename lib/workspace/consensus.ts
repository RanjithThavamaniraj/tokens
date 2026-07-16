// Purely deterministic consensus analysis over already-in-memory response
// text. No AI calls, no network requests, no randomness, no wall-clock time.
// This module must never infer relationships or sentiment — it only reports
// which literal salient terms are shared or not shared across providers.

import { computeResponseStats } from "./responseStats";

export interface ConsensusResponse {
  id: string;
  displayName: string;
  text: string;
}

export interface ProviderTerms {
  displayName: string;
  terms: string[];
}

export interface ConsensusCoverage {
  providersCompared: number;
  averageWordCount: number;
  averageReadingTimeLabel: string;
  codeBlocksDetected: number;
  tablesDetected: number;
}

export interface ConsensusResult {
  agreementScore: number;
  consensus: string[];
  differences: ProviderTerms[];
  uniqueInsights: ProviderTerms[];
  coverage: ConsensusCoverage;
}

// Conservative, common English stopword list, plus a few generic filler
// words that carry no analytical signal in an LLM-response comparison
// context. Kept deliberately unopinionated (no domain-specific terms).
const STOPWORDS = new Set<string>([
  "the", "and", "for", "with", "that", "this", "you", "your", "are", "but",
  "not", "can", "will", "use", "using", "used", "from", "have", "has", "had",
  "was", "were", "been", "being", "into", "onto", "than", "then", "them",
  "they", "their", "there", "these", "those", "what", "when", "where",
  "which", "while", "who", "whom", "why", "how", "all", "any", "both",
  "each", "few", "more", "most", "other", "some", "such", "only", "own",
  "same", "over", "under", "again", "further", "once", "here", "also",
  "just", "should", "would", "could", "about", "above", "after", "before",
  "between", "during", "out", "off", "down", "our", "ours", "its", "itself",
  "his", "her", "hers", "him", "she", "him", "themselves", "ourselves",
  "yourself", "yourselves", "myself", "himself", "herself", "does", "did",
  "doing", "because", "until", "against", "very", "too", "you're", "it's",
  "let", "lets", "may", "might", "must", "shall", "per", "via", "one",
  "two", "three", "get", "gets", "got", "make", "makes", "made", "like",
  "need", "needs", "way", "ways", "well", "much", "many", "does", "response",
  "answer", "provided", "provide", "provides", "given", "based", "example",
  "examples", "note", "notes", "overall", "however", "therefore", "thus",
  "still", "even", "yet", "within", "without", "across", "along", "among",
]);

function stripFencedCodeBlocks(markdown: string): string {
  return markdown.replace(/```[\s\S]*?```/g, " ");
}

function tokenize(text: string): string[] {
  const withoutCode = stripFencedCodeBlocks(text);
  const lower = withoutCode.toLowerCase();
  // Split on anything that isn't an alphanumeric character.
  const rawTokens = lower.split(/[^a-z0-9]+/).filter((t) => t.length > 0);

  const filtered: string[] = [];
  for (const token of rawTokens) {
    if (token.length < 3) continue;
    if (/^[0-9]+$/.test(token)) continue;
    if (STOPWORDS.has(token)) continue;
    filtered.push(token);
  }
  return filtered;
}

function buildSalientSets(tokens: string[]): {
  unigrams: Set<string>;
  bigrams: Set<string>;
  salient: Set<string>;
} {
  const unigrams = new Set<string>(tokens);
  const bigrams = new Set<string>();
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.add(`${tokens[i]} ${tokens[i + 1]}`);
  }
  const salient = new Set<string>([...unigrams, ...bigrams]);
  return { unigrams, bigrams, salient };
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersectionSize = 0;
  for (const item of a) {
    if (b.has(item)) intersectionSize++;
  }
  const unionSize = a.size + b.size - intersectionSize;
  if (unionSize === 0) return 0;
  return intersectionSize / unionSize;
}

// Removes unigrams from `terms` when both of their constituent words are
// also present (as unigrams) in `terms` AND the bigram itself is present —
// preferring the more specific bigram over its two constituent unigrams,
// to reduce noise in the surfaced list.
function preferBigramsOverUnigrams(terms: string[]): string[] {
  const termSet = new Set(terms);
  const suppressedUnigrams = new Set<string>();
  for (const term of terms) {
    if (term.includes(" ")) {
      const parts = term.split(" ");
      if (parts.length === 2) {
        const [a, b] = parts;
        if (termSet.has(a)) suppressedUnigrams.add(a);
        if (termSet.has(b)) suppressedUnigrams.add(b);
      }
    }
  }
  return terms.filter((t) => !suppressedUnigrams.has(t));
}

function formatReadingTimeLabel(avgWordCount: number): string {
  if (avgWordCount === 0) return "0 min read";
  const minutes = avgWordCount / 200;
  if (minutes < 1) return "< 1 min read";
  return `${Math.round(minutes)} min read`;
}

// Ranks terms by total document-level frequency across providers (desc),
// then alphabetically, for stable deterministic output.
function rankTerms(terms: string[], frequency: Map<string, number>): string[] {
  return [...terms].sort((a, b) => {
    const freqDiff = (frequency.get(b) ?? 0) - (frequency.get(a) ?? 0);
    if (freqDiff !== 0) return freqDiff;
    return a.localeCompare(b);
  });
}

export function computeConsensus(responses: ConsensusResponse[]): ConsensusResult {
  const providerSalientSets = responses.map((r) => {
    const tokens = tokenize(r.text);
    return { response: r, ...buildSalientSets(tokens) };
  });

  const coverage = computeCoverage(responses);

  if (responses.length < 2) {
    return {
      agreementScore: 0,
      consensus: [],
      differences: [],
      uniqueInsights: [],
      coverage,
    };
  }

  // Agreement score: average pairwise Jaccard similarity over unigram sets.
  let pairSum = 0;
  let pairCount = 0;
  for (let i = 0; i < providerSalientSets.length; i++) {
    for (let j = i + 1; j < providerSalientSets.length; j++) {
      pairSum += jaccard(providerSalientSets[i].unigrams, providerSalientSets[j].unigrams);
      pairCount++;
    }
  }
  const agreementScore = pairCount === 0 ? 0 : Math.round((pairSum / pairCount) * 100);

  // Document frequency across the "salient" (unigram + bigram) term sets.
  const documentFrequency = new Map<string, number>();
  // Total (summed) frequency across providers — a term present once in each
  // of N providers has total frequency N here, same as document frequency,
  // since we treat each provider's salient set membership as binary.
  for (const { salient } of providerSalientSets) {
    for (const term of salient) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    }
  }

  const totalProviders = responses.length;

  // Consensus: present in ALL providers.
  const consensusCandidates: string[] = [];
  for (const [term, freq] of documentFrequency) {
    if (freq === totalProviders) consensusCandidates.push(term);
  }
  let consensus = rankTerms(consensusCandidates, documentFrequency);
  consensus = preferBigramsOverUnigrams(consensus).slice(0, 8);

  // Partition every non-universal term so it appears in AT MOST ONE section
  // (no term is ever both a "difference" and a "unique insight"):
  //   • solo    — present in exactly one provider (df === 1)
  //   • partial — present in some but not all providers (2 <= df <= N-1);
  //               only possible when there are 3+ providers
  //
  // With exactly two providers there is no partial band, so the solo terms
  // are the only difference signal and are surfaced under Differences (the
  // natural reading of a two-way comparison). Unique Insights is reserved
  // for 3+ providers, where "mentioned by only one of several" is a distinct
  // signal from partial agreement — keeping the two sections non-duplicative.
  const soloByProviderIndex: string[][] = providerSalientSets.map(() => []);
  const partialByProviderIndex: string[][] = providerSalientSets.map(() => []);
  for (const [term, freq] of documentFrequency) {
    if (freq === totalProviders) continue; // universal terms are consensus
    for (let i = 0; i < providerSalientSets.length; i++) {
      if (!providerSalientSets[i].salient.has(term)) continue;
      if (freq === 1) {
        soloByProviderIndex[i].push(term);
      } else {
        partialByProviderIndex[i].push(term);
      }
    }
  }

  const toProviderTerms = (byProviderIndex: string[][]): ProviderTerms[] => {
    const out: ProviderTerms[] = [];
    for (let i = 0; i < providerSalientSets.length; i++) {
      const terms = byProviderIndex[i];
      if (terms.length === 0) continue;
      const ranked = preferBigramsOverUnigrams(rankTerms(terms, documentFrequency)).slice(0, 6);
      if (ranked.length === 0) continue;
      out.push({
        displayName: providerSalientSets[i].response.displayName,
        terms: ranked,
      });
    }
    return out;
  };

  const solo = toProviderTerms(soloByProviderIndex);
  const partial = toProviderTerms(partialByProviderIndex);

  const differences = totalProviders === 2 ? solo : partial;
  const uniqueInsights = totalProviders >= 3 ? solo : [];

  return {
    agreementScore,
    consensus,
    differences,
    uniqueInsights,
    coverage,
  };
}

function computeCoverage(responses: ConsensusResponse[]): ConsensusCoverage {
  const providersCompared = responses.length;
  if (providersCompared === 0) {
    return {
      providersCompared: 0,
      averageWordCount: 0,
      averageReadingTimeLabel: formatReadingTimeLabel(0),
      codeBlocksDetected: 0,
      tablesDetected: 0,
    };
  }

  const statsList = responses.map((r) => computeResponseStats(r.text));
  const totalWordCount = statsList.reduce((sum, s) => sum + s.wordCount, 0);
  const averageWordCount = Math.round(totalWordCount / providersCompared);
  const codeBlocksDetected = statsList.reduce((sum, s) => sum + s.codeBlockCount, 0);
  const tablesDetected = statsList.reduce((sum, s) => sum + s.tableCount, 0);

  return {
    providersCompared,
    averageWordCount,
    averageReadingTimeLabel: formatReadingTimeLabel(averageWordCount),
    codeBlocksDetected,
    tablesDetected,
  };
}
