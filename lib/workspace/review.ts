import type { Message } from "@/lib/providers/Provider";

export type ReviewFocus =
  | "general"
  | "correctness"
  | "performance"
  | "security"
  | "architecture"
  | "readability"
  | "best-practices"
  | "edge-cases"
  | "maintainability";

export const REVIEW_FOCUS_OPTIONS: { value: ReviewFocus; label: string }[] = [
  { value: "general", label: "General Review" },
  { value: "correctness", label: "Correctness" },
  { value: "performance", label: "Performance" },
  { value: "security", label: "Security" },
  { value: "architecture", label: "Architecture" },
  { value: "readability", label: "Readability" },
  { value: "best-practices", label: "Best Practices" },
  { value: "edge-cases", label: "Edge Cases" },
  { value: "maintainability", label: "Maintainability" },
];

export function reviewFocusLabel(focus: ReviewFocus): string {
  return (
    REVIEW_FOCUS_OPTIONS.find((o) => o.value === focus)?.label ?? "General Review"
  );
}

export function buildReviewMessages(
  originalUserPrompt: string,
  originalResponseText: string,
  focus: ReviewFocus,
): Message[] {
  return [
    {
      role: "system",
      content:
        "You are an expert reviewer providing constructive feedback on another AI's response. Do not rewrite the response. Identify strengths, weaknesses, inaccuracies, missing considerations, and suggested improvements. Keep the review constructive. Return concise markdown.",
    },
    {
      role: "user",
      content:
        `Original prompt:\n${originalUserPrompt}\n\n` +
        `Response to review:\n${originalResponseText}\n\n` +
        (focus === "general"
          ? ""
          : `Focus area: ${reviewFocusLabel(focus)}\n\n`) +
        "Review the response above. Identify:\n- strengths\n- weaknesses\n- inaccuracies\n- missing considerations\n- suggested improvements\n\nKeep the review constructive. Return concise markdown.",
    },
  ];
}
