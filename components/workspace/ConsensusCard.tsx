"use client";

import type {
  ConfidenceLevel,
  ConsensusV2Result,
  PartialAgreementGroup,
  ProviderTerms,
} from "@/lib/workspace/consensus";

function sectionHeading(text: string) {
  return (
    <p
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "0.75rem",
        fontWeight: 600,
        color: "var(--color-text)",
        marginTop: 10,
      }}
    >
      {text}
    </p>
  );
}

function mutedLine(key: string, text: string) {
  return (
    <p
      key={key}
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "0.8rem",
        color: "var(--color-muted)",
        marginTop: 4,
      }}
    >
      {text}
    </p>
  );
}

function providerTermsLines(groups: ProviderTerms[], prefix: (displayName: string) => string) {
  return groups.map((group) =>
    mutedLine(group.displayName, `${prefix(group.displayName)} ${group.terms.join(", ")}`),
  );
}

// Dot color for the confidence level — accent for High, progressively dimmer
// for Medium/Low. Purely presentational.
const CONFIDENCE_DOT: Record<ConfidenceLevel, string> = {
  High: "#EE7B30",
  Medium: "rgba(248,250,252,0.6)",
  Low: "rgba(248,250,252,0.3)",
};

export default function ConsensusCard({ result }: { result: ConsensusV2Result }) {
  const {
    agreementScore,
    decisionConfidence,
    strongAgreement,
    partialAgreement,
    uniqueInsights,
    openQuestions,
    coverageSummary,
  } = result;

  const strongLabel =
    coverageSummary.providersCompared === 2 ? "Mentioned by both:" : "Mentioned by all providers:";

  const coverageParts = [
    `${coverageSummary.providersCompared} ${coverageSummary.providersCompared === 1 ? "provider" : "providers"} compared`,
    `${coverageSummary.averageWordCount.toLocaleString()} words avg`,
    coverageSummary.averageReadingTimeLabel,
    coverageSummary.averageCodeBlocks > 0
      ? `${coverageSummary.averageCodeBlocks} code blocks avg`
      : null,
    coverageSummary.averageTables > 0 ? `${coverageSummary.averageTables} tables avg` : null,
  ].filter(Boolean);

  return (
    <div
      className="rounded-lg"
      style={{
        background: "var(--color-glass)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        padding: "12px 16px",
        marginBottom: 16,
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "var(--color-text)",
        }}
      >
        Consensus
      </p>

      {/* Decision Confidence — headline decision signal */}
      <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: CONFIDENCE_DOT[decisionConfidence],
            flexShrink: 0,
          }}
        />
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "var(--color-text)",
          }}
        >
          Decision confidence: {decisionConfidence}
        </p>
      </div>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.72rem",
          color: "var(--color-muted)",
          marginTop: 2,
        }}
      >
        Based on agreement, participation, response length, and structure.
      </p>

      {/* Agreement score */}
      <div style={{ marginTop: 10 }}>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.8rem",
            color: "var(--color-muted)",
          }}
        >
          Agreement score: {agreementScore}%
        </p>
        <div
          style={{
            marginTop: 6,
            height: 6,
            borderRadius: 999,
            background: "var(--color-border)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${agreementScore}%`,
              height: "100%",
              background: "#EE7B30",
              borderRadius: 999,
            }}
          />
        </div>
      </div>

      {/* Strong Agreement */}
      {sectionHeading("Strong Agreement")}
      {strongAgreement.length > 0
        ? mutedLine("strong", `${strongLabel} ${strongAgreement.join(", ")}`)
        : mutedLine("strong", "No clear consensus detected.")}

      {/* Partial Agreement */}
      {partialAgreement.length > 0 && (
        <>
          {sectionHeading("Partial Agreement")}
          {partialAgreement.map((group: PartialAgreementGroup) =>
            mutedLine(group.providerNames.join(" + "), `${group.providerNames.join(" + ")}: ${group.terms.join(", ")}`),
          )}
        </>
      )}

      {/* Unique Insights */}
      {uniqueInsights.length > 0 && (
        <>
          {sectionHeading("Unique Insights")}
          {providerTermsLines(uniqueInsights, (name) => `Only ${name} mentions:`)}
        </>
      )}

      {/* Open Questions */}
      {sectionHeading("Open Questions")}
      {openQuestions.length > 0
        ? mutedLine("open", openQuestions.join(", "))
        : mutedLine("open", "No obvious gaps detected.")}

      {/* Coverage Summary */}
      {sectionHeading("Coverage")}
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.75rem",
          color: "var(--color-muted)",
          marginTop: 4,
        }}
      >
        {coverageParts.join(" • ")}
      </p>
    </div>
  );
}
