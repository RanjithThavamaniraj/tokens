import type { ProviderId } from "@/lib/providers/Provider";
import { reviewFocusLabel } from "@/lib/workspace/review";
import { exportToMarkdown, type MarkdownExportOptions } from "./MarkdownExporter";
import { exportToPdf } from "./PdfExporter";
import { exportToDocx } from "./DocxExporter";
import { exportToJsonString } from "./JsonExporter";
import type {
  ExportDocument,
  ExportFormat,
  ExportReviewItem,
  ExportScope,
  ExportSource,
} from "./types";

const SCOPE_TITLES: Record<ExportScope, string> = {
  conversation: "Current Conversation",
  recommendation: "Final Recommendation",
  review: "AI Review",
  debate: "AI Debate",
  project: "Entire Project",
};

function buildConversations(source: ExportSource) {
  return Object.entries(source.workspace.conversations)
    .filter(([, messages]) => Array.isArray(messages) && messages.length > 0)
    .map(([providerId, messages]) => {
      const id = providerId as ProviderId;
      return {
        providerId: id,
        providerName: source.providerName(id),
        modelId: source.workspace.selectedModelIds[id],
        messages: messages ?? [],
      };
    });
}

function buildReviews(source: ExportSource): ExportReviewItem[] {
  const reviews = source.liveReviews ?? source.workspace.reviews;
  const items: ExportReviewItem[] = [];

  for (const [revieweeId, entries] of Object.entries(reviews)) {
    for (const entry of entries ?? []) {
      if (entry.status !== "done" || !entry.text) continue;
      const reviewee = revieweeId as ProviderId;
      items.push({
        revieweeId: reviewee,
        revieweeName: source.providerName(reviewee),
        reviewerId: entry.reviewerId,
        reviewerName: source.providerName(entry.reviewerId),
        focus: reviewFocusLabel(entry.focus),
        text: entry.text,
      });
    }
  }

  return items;
}

function buildDebate(source: ExportSource) {
  const debate = source.liveDebate ?? source.workspace.debate;
  if (!debate) return null;

  return {
    critiques: debate.round1
      .filter((entry) => entry.status === "done" && entry.text)
      .map((entry) => ({
        reviewerName: entry.reviewerDisplayName,
        revieweeName: entry.revieweeDisplayName,
        text: entry.text!,
      })),
    rebuttals: debate.round2
      .filter((entry) => entry.status === "done" && entry.text)
      .map((entry) => ({
        providerName: entry.providerDisplayName,
        text: entry.text!,
      })),
  };
}

function buildRecommendation(source: ExportSource) {
  const recommendation = source.workspace.recommendation;
  if (recommendation?.status !== "done" || !recommendation.text) return null;

  return {
    providerId: recommendation.providerId,
    providerName: source.providerName(recommendation.providerId as ProviderId),
    text: recommendation.text,
  };
}

export function canExportScope(
  source: ExportSource,
  scope: ExportScope,
): { ok: boolean; reason?: string } {
  const conversations = buildConversations(source);
  const reviews = buildReviews(source);
  const debate = buildDebate(source);
  const recommendation = buildRecommendation(source);

  switch (scope) {
    case "conversation":
      return conversations.length > 0
        ? { ok: true }
        : { ok: false, reason: "No conversation content to export yet." };
    case "recommendation":
      return recommendation
        ? { ok: true }
        : {
            ok: false,
            reason: "Generate a final recommendation before exporting.",
          };
    case "review":
      return reviews.length > 0
        ? { ok: true }
        : { ok: false, reason: "No completed AI reviews to export yet." };
    case "debate":
      return debate &&
        (debate.critiques.length > 0 || debate.rebuttals.length > 0)
        ? { ok: true }
        : { ok: false, reason: "No completed AI debate to export yet." };
    case "project":
      return conversations.length > 0 ||
        reviews.length > 0 ||
        debate !== null ||
        recommendation !== null
        ? { ok: true }
        : { ok: false, reason: "This project has no exportable content yet." };
  }
}

export function buildExportDocument(
  source: ExportSource,
  scope: ExportScope,
): ExportDocument {
  const conversations = buildConversations(source);
  const reviews = buildReviews(source);
  const debate = buildDebate(source);
  const recommendation = buildRecommendation(source);
  const exportedAt = new Date().toISOString();

  const base: ExportDocument = {
    title: `${source.project.name} — ${SCOPE_TITLES[scope]}`,
    scope,
    project: {
      id: source.project.id,
      name: source.project.name,
      createdAt: source.project.createdAt,
      updatedAt: source.project.updatedAt,
    },
    exportedAt,
    systemPrompt: source.workspace.systemPrompt || undefined,
    conversations: [],
    reviews: [],
    debate: null,
    recommendation: null,
  };

  switch (scope) {
    case "conversation":
      return { ...base, conversations };
    case "recommendation":
      return { ...base, recommendation };
    case "review":
      return { ...base, reviews };
    case "debate":
      return { ...base, debate };
    case "project":
      return {
        ...base,
        conversations,
        reviews,
        debate,
        recommendation,
      };
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function runExport(
  source: ExportSource,
  scope: ExportScope,
  format: ExportFormat,
  options: MarkdownExportOptions = {},
): Promise<void> {
  const validation = canExportScope(source, scope);
  if (!validation.ok) {
    throw new Error(validation.reason ?? "Nothing to export.");
  }

  const document = buildExportDocument(source, scope);
  const baseName = `${slugify(source.project.name) || "tokens"}-${scope}`;
  const markdownOptions: MarkdownExportOptions = {
    includeTimestamps: options.includeTimestamps ?? true,
    includeProviderMetadata: options.includeProviderMetadata ?? true,
  };

  switch (format) {
    case "markdown": {
      const markdown = exportToMarkdown(document, markdownOptions);
      downloadBlob(
        new Blob([markdown], { type: "text/markdown;charset=utf-8" }),
        `${baseName}.md`,
      );
      return;
    }
    case "json": {
      const json = exportToJsonString(document);
      downloadBlob(
        new Blob([json], { type: "application/json;charset=utf-8" }),
        `${baseName}.json`,
      );
      return;
    }
    case "pdf": {
      downloadBlob(
        await exportToPdf(document, markdownOptions),
        `${baseName}.pdf`,
      );
      return;
    }
    case "docx": {
      downloadBlob(
        await exportToDocx(document, markdownOptions),
        `${baseName}.docx`,
      );
      return;
    }
  }
}
