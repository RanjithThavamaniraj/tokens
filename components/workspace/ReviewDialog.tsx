"use client";

import { useState } from "react";
import type { ProviderId } from "@/lib/providers/Provider";
import {
  REVIEW_FOCUS_OPTIONS,
  type ReviewFocus,
} from "@/lib/workspace/review";

interface ReviewDialogProps {
  reviewerOptions: { id: ProviderId; displayName: string }[];
  onSubmit: (reviewerId: ProviderId, focus: ReviewFocus) => void;
  onCancel: () => void;
}

export default function ReviewDialog({
  reviewerOptions,
  onSubmit,
  onCancel,
}: ReviewDialogProps) {
  const [selectedReviewer, setSelectedReviewer] = useState<ProviderId>(
    reviewerOptions[0]?.id ?? ("openai" as ProviderId),
  );
  const [selectedFocus, setSelectedFocus] = useState<ReviewFocus>("general");

  if (reviewerOptions.length === 0) {
    return (
      <div
        className="rounded-lg"
        style={{
          background: "var(--color-glass)",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          padding: "12px 14px",
          marginTop: 10,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.85rem",
            color: "var(--color-muted)",
            margin: 0,
          }}
        >
          No other connected provider is available to review this response.
        </p>
        <button
          type="button"
          onClick={onCancel}
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.75rem",
            color: "var(--color-text)",
            background: "var(--color-glass)",
            border: "1px solid var(--color-border)",
            borderRadius: 999,
            padding: "4px 10px",
            cursor: "pointer",
            flexShrink: 0,
            marginTop: 8,
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg"
      style={{
        background: "var(--color-glass)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        padding: "12px 14px",
        marginTop: 10,
      }}
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-2">
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.8rem",
              fontWeight: 500,
              color: "var(--color-text)",
            }}
          >
            Reviewer
          </span>
          <select
            value={selectedReviewer}
            onChange={(e) => setSelectedReviewer(e.target.value as ProviderId)}
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
              padding: "6px 10px",
              fontFamily: "var(--font-body)",
              fontSize: "0.8rem",
              borderRadius: 8,
            }}
          >
            {reviewerOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.displayName}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.8rem",
              fontWeight: 500,
              color: "var(--color-text)",
            }}
          >
            Review Focus
          </span>
          <select
            value={selectedFocus}
            onChange={(e) => setSelectedFocus(e.target.value as ReviewFocus)}
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
              padding: "6px 10px",
              fontFamily: "var(--font-body)",
              fontSize: "0.8rem",
              borderRadius: 8,
            }}
          >
            {REVIEW_FOCUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSubmit(selectedReviewer, selectedFocus)}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.75rem",
              color: "var(--color-text)",
              background: "var(--color-glass)",
              border: "1px solid var(--color-border)",
              borderRadius: 999,
              padding: "4px 10px",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Start Review
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.75rem",
              color: "var(--color-text)",
              background: "var(--color-glass)",
              border: "1px solid var(--color-border)",
              borderRadius: 999,
              padding: "4px 10px",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
