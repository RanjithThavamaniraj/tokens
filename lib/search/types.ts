// Shared types for Global Search. Documents are derived on demand from the
// existing localStorage project snapshots — search never stores its own copy
// of any project data.

export type SearchDocumentType =
  | "project"
  | "conversation"
  | "prompt"
  | "response"
  | "recommendation"
  | "review"
  | "debate";

export interface SearchDocument {
  id: string;
  type: SearchDocumentType;
  projectId: string;
  projectName: string;
  /** Primary label shown in the result row. */
  title: string;
  /** Secondary label (e.g. provider display name). */
  subtitle?: string;
  /** Full searchable body text. */
  text: string;
  /**
   * Workspace scroll target key (matched against `search-anchor-*` element
   * ids). Null for results that only open the project.
   */
  anchor: string | null;
}

export interface SearchResultItem {
  document: SearchDocument;
  score: number;
  /** Context window around the first match, for display. */
  snippet: string;
  /** Range of the matched query text within `snippet` (for highlighting). */
  matchStart: number;
  matchLength: number;
}

export interface SearchResultGroup {
  type: SearchDocumentType;
  label: string;
  items: SearchResultItem[];
}

/** Handoff payload from the search modal to the workspace page. */
export interface SearchNavigationTarget {
  projectId: string;
  anchor: string | null;
}
