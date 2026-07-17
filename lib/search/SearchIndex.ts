// Lightweight in-memory inverted index over project data.
//
// Each project gets its own sub-index (documents + token postings), cached by
// the project's `updatedAt` timestamp. Every conversation, review, debate,
// and recommendation change already flows through `projectRepository.save()`,
// which bumps `updatedAt` — so comparing timestamps is enough to know whether
// a project needs re-tokenizing. Untouched projects are never re-indexed.

import type { Message, ProviderId } from "@/lib/providers/Provider";
import type {
  Project,
  ProjectWorkspaceState,
} from "@/lib/projects/ProjectRepository";
import type { SearchDocument } from "./types";

const TITLE_MAX_LENGTH = 64;

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0);
}

function truncate(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length <= TITLE_MAX_LENGTH
    ? compact
    : `${compact.slice(0, TITLE_MAX_LENGTH).trimEnd()}…`;
}

function conversationTitle(messages: Message[]): string | null {
  const firstUser = messages.find((message) => message.role === "user");
  return firstUser ? truncate(firstUser.content) : null;
}

export function buildProjectDocuments(
  project: Project,
  workspace: ProjectWorkspaceState,
  providerName: (id: ProviderId) => string,
): SearchDocument[] {
  const documents: SearchDocument[] = [];
  const base = { projectId: project.id, projectName: project.name };

  documents.push({
    ...base,
    id: `${project.id}:project`,
    type: "project",
    title: project.name,
    text: project.name,
    anchor: null,
  });

  for (const [key, messages] of Object.entries(workspace.conversations)) {
    if (!messages || messages.length === 0) continue;
    const providerId = key as ProviderId;
    const name = providerName(providerId);
    const title = conversationTitle(messages) ?? `${name} conversation`;
    const anchor = `response-${providerId}`;

    documents.push({
      ...base,
      id: `${project.id}:conversation:${providerId}`,
      type: "conversation",
      title,
      subtitle: name,
      // Provider names are searchable through conversation/response docs.
      text: `${title} ${name}`,
      anchor,
    });

    messages.forEach((message, index) => {
      if (message.role === "user") {
        documents.push({
          ...base,
          id: `${project.id}:prompt:${providerId}:${index}`,
          type: "prompt",
          title: truncate(message.content),
          subtitle: name,
          text: message.content,
          anchor,
        });
      } else if (message.role === "assistant") {
        documents.push({
          ...base,
          id: `${project.id}:response:${providerId}:${index}`,
          type: "response",
          title: name,
          subtitle: title,
          text: `${name} ${message.content}`,
          anchor,
        });
      }
    });
  }

  for (const [key, entries] of Object.entries(workspace.reviews)) {
    const revieweeId = key as ProviderId;
    (entries ?? []).forEach((entry, index) => {
      if (!entry.text) return;
      documents.push({
        ...base,
        id: `${project.id}:review:${revieweeId}:${index}`,
        type: "review",
        title: `Review of ${providerName(revieweeId)}`,
        subtitle: `by ${providerName(entry.reviewerId)}`,
        text: entry.text,
        anchor: `response-${revieweeId}`,
      });
    });
  }

  if (workspace.debate) {
    workspace.debate.round1.forEach((entry) => {
      if (!entry.text) return;
      documents.push({
        ...base,
        id: `${project.id}:debate:${entry.key}`,
        type: "debate",
        title: `${entry.reviewerDisplayName} critiques ${entry.revieweeDisplayName}`,
        text: entry.text,
        anchor: "debate",
      });
    });
    workspace.debate.round2.forEach((entry) => {
      if (!entry.text) return;
      documents.push({
        ...base,
        id: `${project.id}:debate:${entry.key}`,
        type: "debate",
        title: `${entry.providerDisplayName} rebuttal`,
        text: entry.text,
        anchor: "debate",
      });
    });
  }

  if (workspace.recommendation?.status === "done" && workspace.recommendation.text) {
    documents.push({
      ...base,
      id: `${project.id}:recommendation`,
      type: "recommendation",
      title: `Final Recommendation`,
      subtitle: providerName(workspace.recommendation.providerId as ProviderId),
      text: workspace.recommendation.text,
      anchor: "recommendation",
    });
  }

  return documents;
}

interface ProjectIndexEntry {
  updatedAt: string;
  documents: SearchDocument[];
  /** token -> local document indexes containing it. */
  postings: Map<string, Set<number>>;
  /** Sorted unique tokens, for binary-searched prefix ranges. */
  sortedTokens: string[];
}

function buildEntry(
  project: Project,
  documents: SearchDocument[],
): ProjectIndexEntry {
  const postings = new Map<string, Set<number>>();
  documents.forEach((document, index) => {
    for (const token of new Set(tokenize(document.text))) {
      let set = postings.get(token);
      if (!set) {
        set = new Set();
        postings.set(token, set);
      }
      set.add(index);
    }
  });
  return {
    updatedAt: project.updatedAt,
    documents,
    postings,
    sortedTokens: [...postings.keys()].sort(),
  };
}

/** First index in `tokens` whose value is >= `prefix` (binary search). */
function lowerBound(tokens: string[], prefix: string): number {
  let low = 0;
  let high = tokens.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (tokens[mid] < prefix) low = mid + 1;
    else high = mid;
  }
  return low;
}

export class SearchIndex {
  private entries = new Map<string, ProjectIndexEntry>();

  needsUpdate(project: Project): boolean {
    return this.entries.get(project.id)?.updatedAt !== project.updatedAt;
  }

  update(
    project: Project,
    workspace: ProjectWorkspaceState,
    providerName: (id: ProviderId) => string,
  ): void {
    this.entries.set(
      project.id,
      buildEntry(project, buildProjectDocuments(project, workspace, providerName)),
    );
  }

  /** Drop deleted projects from the index. */
  prune(liveProjectIds: Set<string>): void {
    for (const projectId of this.entries.keys()) {
      if (!liveProjectIds.has(projectId)) this.entries.delete(projectId);
    }
  }

  /**
   * Documents matching ALL query tokens (each treated as a prefix, so results
   * update live while a word is still being typed). Score favors exact token
   * matches over prefix-only matches.
   */
  match(queryTokens: string[]): { document: SearchDocument; score: number }[] {
    if (queryTokens.length === 0) return [];
    const results: { document: SearchDocument; score: number }[] = [];

    for (const entry of this.entries.values()) {
      let candidates: Map<number, number> | null = null;

      for (const token of queryTokens) {
        const matched = new Map<number, number>();
        const start = lowerBound(entry.sortedTokens, token);
        for (let i = start; i < entry.sortedTokens.length; i++) {
          const indexed = entry.sortedTokens[i];
          if (!indexed.startsWith(token)) break;
          const weight = indexed === token ? 2 : 1;
          for (const docIndex of entry.postings.get(indexed)!) {
            matched.set(docIndex, Math.max(matched.get(docIndex) ?? 0, weight));
          }
        }

        if (candidates === null) {
          candidates = matched;
        } else {
          const intersection = new Map<number, number>();
          for (const [docIndex, score] of candidates) {
            const tokenScore = matched.get(docIndex);
            if (tokenScore !== undefined) {
              intersection.set(docIndex, score + tokenScore);
            }
          }
          candidates = intersection;
        }
        if (candidates.size === 0) break;
      }

      if (!candidates) continue;
      for (const [docIndex, score] of candidates) {
        results.push({ document: entry.documents[docIndex], score });
      }
    }

    return results;
  }
}
