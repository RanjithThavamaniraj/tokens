import type {
  ExportDocument,
  TokensExportJson,
} from "./types";

export function exportToJson(document: ExportDocument): TokensExportJson {
  const projectId = document.project.id;

  const responses = document.conversations.flatMap((thread) =>
    thread.messages
      .filter((message) => message.role === "assistant")
      .map((message) => ({
        projectId,
        providerId: thread.providerId,
        providerName: thread.providerName,
        text: message.content,
      })),
  );

  return {
    version: 1,
    format: "tokens-export",
    exportedAt: document.exportedAt,
    metadata: {
      scope: document.scope,
      title: document.title,
      projectId: document.project.id,
      projectName: document.project.name,
    },
    projects: [
      {
        id: document.project.id,
        name: document.project.name,
        createdAt: document.project.createdAt,
        updatedAt: document.project.updatedAt,
      },
    ],
    conversations: document.conversations.map((thread) => ({
      projectId,
      providerId: thread.providerId,
      providerName: thread.providerName,
      modelId: thread.modelId,
      messages: thread.messages,
    })),
    responses,
    reviews: document.reviews.map((review) => ({
      projectId,
      revieweeId: review.revieweeId,
      revieweeName: review.revieweeName,
      reviewerId: review.reviewerId,
      reviewerName: review.reviewerName,
      focus: review.focus,
      text: review.text,
    })),
    debates: document.debate
      ? [
          {
            projectId,
            critiques: document.debate.critiques,
            rebuttals: document.debate.rebuttals,
          },
        ]
      : [],
    recommendations: document.recommendation
      ? [
          {
            projectId,
            providerId: document.recommendation.providerId,
            providerName: document.recommendation.providerName,
            text: document.recommendation.text,
          },
        ]
      : [],
  };
}

export function exportToJsonString(document: ExportDocument): string {
  return `${JSON.stringify(exportToJson(document), null, 2)}\n`;
}
