// Purely deterministic response statistics and comparison summary helpers.
// No AI, no network calls, no dependency on Provider/execution code.

export interface ResponseStats {
  characterCount: number;
  wordCount: number;
  readingTimeLabel: string;
  codeBlockCount: number;
  tableCount: number;
  listCount: number;
}

export function computeResponseStats(markdown: string): ResponseStats {
  // characterCount and wordCount are computed from the FULL markdown,
  // including any fenced code block content — do not strip code for these two.
  const characterCount = markdown.length;
  const words = markdown.trim().length === 0 ? [] : markdown.trim().split(/\s+/);
  const wordCount = words.length;

  const minutes = wordCount / 200; // ~200 wpm, standard estimate
  const readingTimeLabel =
    wordCount === 0 ? "0 min read" : minutes < 1 ? "< 1 min read" : `${Math.round(minutes)} min read`;

  const codeBlockMatches = markdown.match(/```[\s\S]*?```/g) ?? [];
  const codeBlockCount = codeBlockMatches.length;

  // Strip fenced code blocks ONLY before detecting tables/lists, so a code
  // sample that happens to contain "|" or "-" characters isn't miscounted
  // as a real markdown table or list.
  const withoutCodeBlocks = markdown.replace(/```[\s\S]*?```/g, "");

  const tableDelimiterMatches =
    withoutCodeBlocks.match(/^[ \t]*\|?[ \t]*:?-{2,}:?[ \t]*(\|[ \t]*:?-{2,}:?[ \t]*)+\|?[ \t]*$/gm) ?? [];
  const tableCount = tableDelimiterMatches.length;

  const lines = withoutCodeBlocks.split("\n");
  const listMarker = /^[ \t]*([-*+]|\d+[.)])\s+/;
  let listCount = 0;
  let inList = false;
  for (const line of lines) {
    if (listMarker.test(line)) {
      if (!inList) {
        listCount++;
        inList = true;
      }
    } else if (line.trim() !== "") {
      inList = false;
    }
  }

  return { characterCount, wordCount, readingTimeLabel, codeBlockCount, tableCount, listCount };
}

export interface ComparisonEntry {
  id: string;
  displayName: string;
  stats: ResponseStats;
}

function pluralize(count: number, singular: string): string {
  return count === 1 ? singular : `${singular}s`;
}

function joinNames(names: string[]): string {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

function subjectForCount(count: number, total: number): string {
  if (count === total) {
    return total === 2 ? "Both providers" : "All providers";
  }
  return `${count} ${pluralize(count, "provider")}`;
}

// Deterministic ONLY — objective counts and lengths, never a qualitative
// judgment (no "better", "more accurate", "more creative", etc.).
export function buildComparisonSummary(entries: ComparisonEntry[]): string[] {
  if (entries.length < 2) return [];

  const lines: string[] = [`Compared ${entries.length} providers`];

  const maxWords = Math.max(...entries.map((e) => e.stats.wordCount));
  const minWords = Math.min(...entries.map((e) => e.stats.wordCount));

  if (maxWords === minWords) {
    lines.push("All responses were similar in length.");
  } else {
    const longest = entries.filter((e) => e.stats.wordCount === maxWords).map((e) => e.displayName);
    const shortest = entries.filter((e) => e.stats.wordCount === minWords).map((e) => e.displayName);
    lines.push(`${joinNames(longest)} produced the longest response.`);
    lines.push(`${joinNames(shortest)} produced the shortest response.`);
  }

  const withCode = entries.filter((e) => e.stats.codeBlockCount > 0).length;
  if (withCode > 0) {
    lines.push(`${subjectForCount(withCode, entries.length)} generated code.`);
  }

  const withTables = entries.filter((e) => e.stats.tableCount > 0).length;
  if (withTables > 0) {
    lines.push(`${subjectForCount(withTables, entries.length)} generated tables.`);
  }

  return lines;
}
