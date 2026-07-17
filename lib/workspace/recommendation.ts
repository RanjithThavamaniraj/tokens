import type { Message } from "@/lib/providers/Provider";
import type { ConsensusV2Result } from "./consensus";

export interface RecommendationProviderResponse {
  id: string;
  displayName: string;
  text: string;
}

export interface RecommendationReview {
  revieweeDisplayName: string;
  reviewerDisplayName: string;
  focusLabel: string;
  text: string;
}

export interface RecommendationDebateCritique {
  reviewerDisplayName: string;
  revieweeDisplayName: string;
  text: string;
}

export interface RecommendationDebateRebuttal {
  providerDisplayName: string;
  text: string;
}

export interface RecommendationDebate {
  critiques: RecommendationDebateCritique[];
  rebuttals: RecommendationDebateRebuttal[];
}

export interface RecommendationInput {
  originalUserPrompt: string;
  providerResponses: RecommendationProviderResponse[];
  consensus: ConsensusV2Result;
  reviews?: RecommendationReview[];
  debate?: RecommendationDebate;
}

export type RecommendationResult = {
  text: string;
};

export type RecommendationState = {
  providerId: string;
  status: "loading" | "done" | "error";
  text?: string;
  error?: string;
};

export interface RecommendationValidation {
  ok: boolean;
  reason?: string;
}

export function canGenerateRecommendation(
  completedResponseCount: number,
): RecommendationValidation {
  if (completedResponseCount < 2) {
    return {
      ok: false,
      reason:
        "Run at least two providers and wait for completed responses before generating a final recommendation.",
    };
  }
  return { ok: true };
}

function formatConsensusSection(consensus: ConsensusV2Result): string {
  const lines: string[] = [
    "## Consensus Engine",
    "",
    `Agreement Score: ${Math.round(consensus.agreementScore * 100)}%`,
    `Decision Confidence: ${consensus.decisionConfidence}`,
    "",
  ];

  if (consensus.strongAgreement.length > 0) {
    lines.push("Strong Agreement:");
    for (const term of consensus.strongAgreement) {
      lines.push(`- ${term}`);
    }
    lines.push("");
  }

  if (consensus.partialAgreement.length > 0) {
    lines.push("Partial Agreement:");
    for (const group of consensus.partialAgreement) {
      lines.push(
        `- ${group.providerNames.join(", ")}: ${group.terms.join(", ")}`,
      );
    }
    lines.push("");
  }

  if (consensus.openQuestions.length > 0) {
    lines.push("Open Questions:");
    for (const question of consensus.openQuestions) {
      lines.push(`- ${question}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function buildRecommendationMessages(
  input: RecommendationInput,
): Message[] {
  const sections: string[] = [
    "## Original User Prompt",
    "",
    input.originalUserPrompt,
    "",
    "## Provider Responses",
    "",
  ];

  for (const response of input.providerResponses) {
    sections.push(`### ${response.displayName}`, "", response.text, "");
  }

  sections.push(formatConsensusSection(input.consensus));

  if (input.reviews && input.reviews.length > 0) {
    sections.push("## AI Reviews", "");
    for (const review of input.reviews) {
      sections.push(
        `### Review of ${review.revieweeDisplayName} by ${review.reviewerDisplayName} (${review.focusLabel})`,
        "",
        review.text,
        "",
      );
    }
  }

  if (input.debate) {
    const { critiques, rebuttals } = input.debate;
    if (critiques.length > 0 || rebuttals.length > 0) {
      sections.push("## AI Debate", "");
      if (critiques.length > 0) {
        sections.push("### Round 1 Critiques", "");
        for (const critique of critiques) {
          sections.push(
            `#### ${critique.reviewerDisplayName} reviewing ${critique.revieweeDisplayName}`,
            "",
            critique.text,
            "",
          );
        }
      }
      if (rebuttals.length > 0) {
        sections.push("### Round 2 Rebuttals", "");
        for (const rebuttal of rebuttals) {
          sections.push(
            `#### ${rebuttal.providerDisplayName}`,
            "",
            rebuttal.text,
            "",
          );
        }
      }
    }
  }

  sections.push(
    "Using only the evidence above, produce a final recommendation with these sections:",
    "- Executive Summary",
    "- Recommended Solution",
    "- Why this recommendation was selected",
    "- Trade-offs",
    "- Risks",
    "- Alternative approaches",
    "- Concrete Next Steps",
    "",
    "Do not invent information that is not supported by the evidence. Return clean Markdown.",
  );

  return [
    {
      role: "system",
      content:
        "You are an impartial decision advisor. Analyze all available evidence. Do not invent information. Synthesize the provided provider responses, consensus analysis, reviews, and debate results when present. Produce: Executive Summary, Recommended Solution, Why this recommendation was selected, Trade-offs, Risks, Alternative approaches, and Concrete Next Steps. Return clean Markdown.",
    },
    {
      role: "user",
      content: sections.join("\n"),
    },
  ];
}
