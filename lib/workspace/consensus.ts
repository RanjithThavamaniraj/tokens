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

// ---------------------------------------------------------------------------
// Consensus Engine v2 — additional deterministic decision insights.
//
// Everything below is ADDITIVE. It reuses computeConsensus (v1) and the
// private helpers above; it never mutates or recomputes v1's output. Still
// fully deterministic: no AI, no network, no randomness, no wall-clock time.
// ---------------------------------------------------------------------------

export type ConfidenceLevel = "High" | "Medium" | "Low";

export interface PartialAgreementGroup {
  providerNames: string[];
  terms: string[];
}

export interface CoverageSummary {
  providersCompared: number;
  averageWordCount: number;
  averageReadingTimeLabel: string;
  averageCodeBlocks: number; // one decimal place
  averageTables: number; // one decimal place
}

export interface ConsensusV2Result {
  agreementScore: number;
  decisionConfidence: ConfidenceLevel;
  confidenceScore: number; // 0-100, for transparency
  strongAgreement: string[]; // reused from v1: mentioned by ALL providers
  partialAgreement: PartialAgreementGroup[]; // shared by 2..N-1 providers
  uniqueInsights: ProviderTerms[]; // mentioned by exactly one provider
  openQuestions: string[]; // curated topics inconsistently covered; [] if none
  coverageSummary: CoverageSummary;
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

// Curated technical concern-topics. A topic can only ever surface as an "open
// question" when at least one provider actually raised it (so it is provably
// relevant to THIS discussion) yet not every provider did (so coverage is
// inconsistent). A topic mentioned by zero providers is NEVER flagged: we
// cannot deterministically assert it is relevant to an arbitrary prompt
// without inventing off-domain relevance. Detecting genuinely-absent but
// domain-relevant topics is where a future AI-powered engine would extend
// this — deterministic analysis intentionally stops short of guessing.
const OPEN_QUESTION_TOPICS: { label: string; keywords: string[] }[] = [
  { label: "Authentication", keywords: ["authentication", "auth", "login", "oauth", "jwt", "session", "credential"] },
  { label: "Authorization & Security", keywords: ["security", "authorization", "permission", "encryption", "vulnerabilit", "xss", "csrf", "sanitiz"] },
  { label: "Performance", keywords: ["performance", "latency", "throughput", "optimize", "optimization", "caching", "cache"] },
  { label: "Error Handling", keywords: ["error handling", "exception", "retry", "fallback", "failure", "catch block", "try/catch"] },
  { label: "Testing", keywords: ["testing", "unit test", "integration test", "test coverage", "jest", "vitest", "pytest"] },
  { label: "Deployment", keywords: ["deployment", "deploy", "ci/cd", "docker", "kubernetes", "hosting", "pipeline"] },
  { label: "Scalability", keywords: ["scalability", "scaling", "scale horizontally", "load balanc", "sharding"] },
  { label: "Accessibility", keywords: ["accessibility", "a11y", "aria", "screen reader", "wcag"] },
];

export function computeConsensusV2(responses: ConsensusResponse[]): ConsensusV2Result {
  // Reuse v1 wholesale — strong agreement, agreement score, and base coverage
  // all come straight from computeConsensus (no recomputation of those).
  const v1 = computeConsensus(responses);
  const totalProviders = responses.length;

  const coverageSummary: CoverageSummary = {
    providersCompared: v1.coverage.providersCompared,
    averageWordCount: v1.coverage.averageWordCount,
    averageReadingTimeLabel: v1.coverage.averageReadingTimeLabel,
    averageCodeBlocks:
      totalProviders === 0
        ? 0
        : Math.round((v1.coverage.codeBlocksDetected / totalProviders) * 10) / 10,
    averageTables:
      totalProviders === 0
        ? 0
        : Math.round((v1.coverage.tablesDetected / totalProviders) * 10) / 10,
  };

  if (totalProviders < 2) {
    return {
      agreementScore: v1.agreementScore,
      decisionConfidence: "Low",
      confidenceScore: 0,
      strongAgreement: v1.consensus,
      partialAgreement: [],
      uniqueInsights: [],
      openQuestions: [],
      coverageSummary,
    };
  }

  // Rebuild the salient term sets via the same private helpers v1 uses.
  const providerSalientSets = responses.map((r) => ({
    response: r,
    ...buildSalientSets(tokenize(r.text)),
  }));

  const documentFrequency = new Map<string, number>();
  const providersByTerm = new Map<string, number[]>();
  for (let i = 0; i < providerSalientSets.length; i++) {
    for (const term of providerSalientSets[i].salient) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
      const owners = providersByTerm.get(term);
      if (owners) {
        owners.push(i);
      } else {
        providersByTerm.set(term, [i]);
      }
    }
  }

  // Partial agreement: terms shared by 2..N-1 providers, grouped by the exact
  // set of providers that share them ("OpenAI + Claude: caching").
  const groupTermsByKey = new Map<string, { providerNames: string[]; terms: string[] }>();
  for (const [term, freq] of documentFrequency) {
    if (freq < 2 || freq > totalProviders - 1) continue;
    const owners = providersByTerm.get(term) ?? [];
    const providerNames = owners.map((i) => providerSalientSets[i].response.displayName);
    const key = providerNames.join(" + ");
    const existing = groupTermsByKey.get(key);
    if (existing) {
      existing.terms.push(term);
    } else {
      groupTermsByKey.set(key, { providerNames, terms: [term] });
    }
  }
  const partialAgreement: PartialAgreementGroup[] = [];
  for (const { providerNames, terms } of groupTermsByKey.values()) {
    const ranked = preferBigramsOverUnigrams(rankTerms(terms, documentFrequency)).slice(0, 6);
    if (ranked.length === 0) continue;
    partialAgreement.push({ providerNames, terms: ranked });
  }
  partialAgreement.sort((a, b) => {
    const sizeDiff = b.providerNames.length - a.providerNames.length;
    if (sizeDiff !== 0) return sizeDiff;
    return a.providerNames.join(" + ").localeCompare(b.providerNames.join(" + "));
  });

  // Unique insights: terms mentioned by exactly one provider, grouped per
  // provider (for all N >= 2).
  const soloByProviderIndex: string[][] = providerSalientSets.map(() => []);
  for (const [term, freq] of documentFrequency) {
    if (freq !== 1) continue;
    const owner = (providersByTerm.get(term) ?? [])[0];
    if (owner !== undefined) soloByProviderIndex[owner].push(term);
  }
  const uniqueInsights: ProviderTerms[] = [];
  for (let i = 0; i < providerSalientSets.length; i++) {
    const ranked = preferBigramsOverUnigrams(
      rankTerms(soloByProviderIndex[i], documentFrequency),
    ).slice(0, 6);
    if (ranked.length === 0) continue;
    uniqueInsights.push({
      displayName: providerSalientSets[i].response.displayName,
      terms: ranked,
    });
  }

  // Decision confidence: a transparent, deterministic weighted heuristic over
  // four measurable signals (NOT an inference). Weights are fixed; agreement
  // dominates because it is the core consensus signal.
  const agreement = clamp01(v1.agreementScore / 100);
  const participation = clamp01((totalProviders - 1) / 2); // N=2 -> .5, N>=3 -> 1
  const completeness = clamp01(v1.coverage.averageWordCount / 250);
  const structuredCount = responses.filter((r) => {
    const stats = computeResponseStats(r.text);
    return stats.codeBlockCount > 0 || stats.tableCount > 0 || stats.listCount > 0;
  }).length;
  const structure = totalProviders === 0 ? 0 : structuredCount / totalProviders;
  const score = 0.4 * agreement + 0.2 * participation + 0.2 * completeness + 0.2 * structure;
  const confidenceScore = Math.round(score * 100);
  const decisionConfidence: ConfidenceLevel =
    score >= 0.66 ? "High" : score >= 0.4 ? "Medium" : "Low";

  // Open questions: curated technical topics raised by SOME but not ALL
  // providers (inconsistently covered). Never topics with zero mentions.
  const flaggedTopics: { label: string; providerCount: number }[] = [];
  for (const topic of OPEN_QUESTION_TOPICS) {
    let providerCount = 0;
    for (const r of responses) {
      const lower = r.text.toLowerCase();
      if (topic.keywords.some((keyword) => lower.includes(keyword))) {
        providerCount++;
      }
    }
    if (providerCount >= 1 && providerCount <= totalProviders - 1) {
      flaggedTopics.push({ label: topic.label, providerCount });
    }
  }
  flaggedTopics.sort((a, b) => {
    const countDiff = a.providerCount - b.providerCount;
    if (countDiff !== 0) return countDiff;
    return a.label.localeCompare(b.label);
  });
  const openQuestions = flaggedTopics.slice(0, 6).map((t) => t.label);

  return {
    agreementScore: v1.agreementScore,
    decisionConfidence,
    confidenceScore,
    strongAgreement: v1.consensus,
    partialAgreement,
    uniqueInsights,
    openQuestions,
    coverageSummary,
  };
}
