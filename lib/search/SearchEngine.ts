// Query layer over SearchIndex plus the navigation handoff between the
// search modal (rendered in the Navbar on any page) and the workspace page.

import type { ProviderId } from "@/lib/providers/Provider";
import { createProvider } from "@/lib/providers/ProviderFactory";
import { projectRepository } from "@/lib/projects/ProjectRepository";
import { SearchIndex, tokenize } from "./SearchIndex";
import type {
  SearchDocument,
  SearchDocumentType,
  SearchNavigationTarget,
  SearchResultGroup,
  SearchResultItem,
} from "./types";

const GROUPS: { type: SearchDocumentType; label: string }[] = [
  { type: "project", label: "Projects" },
  { type: "conversation", label: "Conversations" },
  { type: "prompt", label: "Prompts" },
  { type: "response", label: "Responses" },
  { type: "recommendation", label: "Recommendations" },
  { type: "review", label: "Reviews" },
  { type: "debate", label: "Debate" },
];

const SNIPPET_RADIUS = 44;

const providerNames = new Map<string, string>();

function providerName(id: ProviderId): string {
  const cached = providerNames.get(id);
  if (cached) return cached;
  const name = createProvider(id)?.displayName ?? id;
  providerNames.set(id, name);
  return name;
}

/** Context window around the first query-token occurrence in the text. */
function buildSnippet(
  text: string,
  queryTokens: string[],
): { snippet: string; matchStart: number; matchLength: number } {
  const compact = text.replace(/\s+/g, " ").trim();
  const lower = compact.toLowerCase();

  let matchIndex = -1;
  let matchLength = 0;
  for (const token of queryTokens) {
    const index = lower.indexOf(token);
    if (index !== -1 && (matchIndex === -1 || index < matchIndex)) {
      matchIndex = index;
      matchLength = token.length;
    }
  }

  if (matchIndex === -1) {
    const snippet =
      compact.length <= SNIPPET_RADIUS * 2
        ? compact
        : `${compact.slice(0, SNIPPET_RADIUS * 2)}…`;
    return { snippet, matchStart: -1, matchLength: 0 };
  }

  const start = Math.max(0, matchIndex - SNIPPET_RADIUS);
  const end = Math.min(compact.length, matchIndex + matchLength + SNIPPET_RADIUS * 2);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < compact.length ? "…" : "";
  return {
    snippet: `${prefix}${compact.slice(start, end)}${suffix}`,
    matchStart: matchIndex - start + prefix.length,
    matchLength,
  };
}

export class SearchEngine {
  private index = new SearchIndex();

  /**
   * Sync the index with localStorage. Only projects whose `updatedAt`
   * changed since the last refresh are re-tokenized.
   */
  async refresh(): Promise<void> {
    const projects = await projectRepository.list();
    for (const project of projects) {
      if (!this.index.needsUpdate(project)) continue;
      const workspace = await projectRepository.get(project.id);
      if (workspace) this.index.update(project, workspace, providerName);
    }
    this.index.prune(new Set(projects.map((project) => project.id)));
  }

  search(query: string, limitPerGroup = 5): SearchResultGroup[] {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    const matches = this.index.match(queryTokens);
    const byType = new Map<
      SearchDocumentType,
      { document: SearchDocument; score: number }[]
    >();

    for (const { document, score } of matches) {
      // Title hits rank above body-only hits within each group.
      const titleBonus = document.title
        .toLowerCase()
        .includes(queryTokens[0])
        ? 3
        : 0;
      const items = byType.get(document.type) ?? [];
      items.push({ document, score: score + titleBonus });
      byType.set(document.type, items);
    }

    return GROUPS.flatMap(({ type, label }): SearchResultGroup[] => {
      const items = byType.get(type);
      if (!items || items.length === 0) return [];
      items.sort((a, b) => b.score - a.score);
      return [
        {
          type,
          label,
          // Snippets are built only for the visible top results — never for
          // the full match set, which can be very large on short queries.
          items: items
            .slice(0, limitPerGroup)
            .map(({ document, score }): SearchResultItem => {
              return {
                document,
                score,
                ...buildSnippet(document.text, queryTokens),
              };
            }),
        },
      ];
    });
  }
}

export const searchEngine = new SearchEngine();

// ---------------------------------------------------------------------------
// Navigation handoff
//
// The modal writes the target and notifies; the workspace page consumes it
// (on hydration when arriving from another page, or via the event when
// already mounted).
// ---------------------------------------------------------------------------

const NAVIGATION_KEY = "tokens:search-navigation:v1";
export const SEARCH_NAVIGATE_EVENT = "tokens:search-navigate";

export function requestSearchNavigation(target: SearchNavigationTarget): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(NAVIGATION_KEY, JSON.stringify(target));
  window.dispatchEvent(new Event(SEARCH_NAVIGATE_EVENT));
}

export function consumeSearchNavigation(): SearchNavigationTarget | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(NAVIGATION_KEY);
  if (!raw) return null;
  window.sessionStorage.removeItem(NAVIGATION_KEY);
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    const target = parsed as Partial<SearchNavigationTarget>;
    if (typeof target.projectId !== "string") return null;
    return {
      projectId: target.projectId,
      anchor: typeof target.anchor === "string" ? target.anchor : null,
    };
  } catch {
    return null;
  }
}
