import type { Message, ProviderId } from "@/lib/providers/Provider";
import type {
  Project,
  ProjectDebateState,
  ProjectReviewEntry,
  ProjectWorkspaceState,
} from "@/lib/projects/ProjectRepository";

export type ExportScope =
  | "conversation"
  | "recommendation"
  | "review"
  | "debate"
  | "project";

export type ExportFormat = "markdown" | "pdf" | "docx" | "json";

export const EXPORT_SCOPE_OPTIONS: { value: ExportScope; label: string }[] = [
  { value: "conversation", label: "Current Conversation" },
  { value: "recommendation", label: "Final Recommendation" },
  { value: "review", label: "AI Review" },
  { value: "debate", label: "AI Debate" },
  { value: "project", label: "Entire Project" },
];

export const EXPORT_FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: "markdown", label: "Markdown" },
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "DOCX" },
  { value: "json", label: "JSON" },
];

export interface ExportConversationThread {
  providerId: ProviderId;
  providerName: string;
  modelId?: string;
  messages: Message[];
}

export interface ExportReviewItem {
  revieweeId: ProviderId;
  revieweeName: string;
  reviewerId: ProviderId;
  reviewerName: string;
  focus: string;
  text: string;
}

export interface ExportDebateCritique {
  reviewerName: string;
  revieweeName: string;
  text: string;
}

export interface ExportDebateRebuttal {
  providerName: string;
  text: string;
}

export interface ExportDocument {
  title: string;
  scope: ExportScope;
  project: Pick<Project, "id" | "name" | "createdAt" | "updatedAt">;
  exportedAt: string;
  systemPrompt?: string;
  conversations: ExportConversationThread[];
  reviews: ExportReviewItem[];
  debate: {
    critiques: ExportDebateCritique[];
    rebuttals: ExportDebateRebuttal[];
  } | null;
  recommendation: {
    providerId: string;
    providerName: string;
    text: string;
  } | null;
}

/** Versioned JSON payload designed for a future Tokens importer. */
export interface TokensExportJson {
  version: 1;
  format: "tokens-export";
  exportedAt: string;
  metadata: {
    scope: ExportScope;
    title: string;
    projectId: string;
    projectName: string;
  };
  projects: Array<{
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  }>;
  conversations: Array<{
    projectId: string;
    providerId: ProviderId;
    providerName: string;
    modelId?: string;
    messages: Message[];
  }>;
  responses: Array<{
    projectId: string;
    providerId: ProviderId;
    providerName: string;
    text: string;
  }>;
  reviews: Array<{
    projectId: string;
    revieweeId: ProviderId;
    revieweeName: string;
    reviewerId: ProviderId;
    reviewerName: string;
    focus: string;
    text: string;
  }>;
  debates: Array<{
    projectId: string;
    critiques: ExportDebateCritique[];
    rebuttals: ExportDebateRebuttal[];
  }>;
  recommendations: Array<{
    projectId: string;
    providerId: string;
    providerName: string;
    text: string;
  }>;
}

export interface ExportSource {
  project: Project;
  workspace: ProjectWorkspaceState;
  providerName: (id: ProviderId) => string;
  /** Reviews may still be in-session and not yet mirrored into the snapshot. */
  liveReviews?: Partial<Record<ProviderId, ProjectReviewEntry[]>>;
  liveDebate?: ProjectDebateState | null;
}

export type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3 | 4; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; items: string[] }
  | { type: "numbered"; items: string[] }
  | { type: "code"; language: string; code: string }
  | { type: "blockquote"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "hr" };
