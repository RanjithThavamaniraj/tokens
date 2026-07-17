import type { Message } from "@/lib/providers/Provider";
import { buildReviewMessages } from "./review";

export interface DebateParticipant {
  id: string; // ProviderId, but keep this module decoupled — use string
  displayName: string;
  originalUserPrompt: string;
  originalResponseText: string;
}

export interface DebatePairing {
  reviewer: DebateParticipant;
  reviewee: DebateParticipant;
}

// Reusable, deterministic ring pairing: participant i is reviewed by the
// NEXT participant in the input order (wrapping around). For N=3 this
// produces exactly "Claude reviews OpenAI, Gemini reviews Claude, OpenAI
// reviews Gemini" (given input order [OpenAI, Claude, Gemini]). For N=2 it
// degenerates to mutual review: each reviews the other. No special-casing
// by count — the same formula covers both, and scales to more providers.
export function computeDebateRing(participants: DebateParticipant[]): DebatePairing[] {
  const n = participants.length;
  if (n < 2) return [];
  return participants.map((reviewee, i) => ({
    reviewee,
    reviewer: participants[(i + 1) % n],
  }));
}

export interface DebateValidation {
  ok: boolean;
  reason?: string;
}

export function canStartDebate(participants: DebateParticipant[]): DebateValidation {
  if (participants.length < 2) {
    return { ok: false, reason: "Run at least two providers to start a debate." };
  }
  return { ok: true };
}

// Round 1: reuse the Review prompt builder directly (a Round 1 critique IS
// a general-focus Review) — no duplicated prompt logic.
export function buildDebateReviewMessages(pairing: DebatePairing): Message[] {
  return buildReviewMessages(
    pairing.reviewee.originalUserPrompt,
    pairing.reviewee.originalResponseText,
    "general",
  );
}

// Round 2: a NEW prompt — the original provider receives its own response
// plus the critique it received, and is asked whether it would revise.
export function buildRebuttalMessages(
  originalResponseText: string,
  critiqueText: string,
): Message[] {
  return [
    {
      role: "system",
      content:
        "You are participating in a structured debate about your own prior response. Consider the critique you received and decide whether to revise your answer.",
    },
    {
      role: "user",
      content:
        `Your original response:\n${originalResponseText}\n\n` +
        `Critique you received:\n${critiqueText}\n\n` +
        "Would you revise your answer? If yes, provide only the revised sections. " +
        "If not, briefly explain why your original answer still stands. " +
        "Return concise markdown.",
    },
  ];
}
