"use client";

import type { ConsensusResult, ProviderTerms } from "@/lib/workspace/consensus";

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

function providerTermsLines(groups: ProviderTerms[], prefix: (displayName: string) => string) {
  return groups.map((group) => (
    <p
      key={group.displayName}
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "0.8rem",
        color: "var(--color-muted)",
        marginTop: 4,
      }}
    >
      {prefix(group.displayName)} {group.terms.join(", ")}
    </p>
  ));
}

export default function ConsensusCard({ result }: { result: ConsensusResult }) {
  const { agreementScore, consensus, differences, uniqueInsights, coverage } = result;

  const consensusLabel = coverage.providersCompared === 2 ? "Mentioned by both:" : "Mentioned by all providers:";

  const coverageParts = [
    `${coverage.providersCompared} ${coverage.providersCompared === 1 ? "provider" : "providers"} compared`,
    `${coverage.averageWordCount.toLocaleString()} words avg`,
    coverage.averageReadingTimeLabel,
    coverage.codeBlocksDetected > 0
      ? `${coverage.codeBlocksDetected} ${coverage.codeBlocksDetected === 1 ? "code block" : "code blocks"} detected`
      : null,
    coverage.tablesDetected > 0
      ? `${coverage.tablesDetected} ${coverage.tablesDetected === 1 ? "table" : "tables"} detected`
      : null,
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

      <div style={{ marginTop: 8 }}>
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

      {consensus.length > 0 ? (
        <>
          {sectionHeading("Consensus")}
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.8rem",
              color: "var(--color-muted)",
              marginTop: 4,
            }}
          >
            {consensusLabel} {consensus.join(", ")}
          </p>
        </>
      ) : (
        <>
          {sectionHeading("Consensus")}
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.8rem",
              color: "var(--color-muted)",
              marginTop: 4,
            }}
          >
            No clear consensus detected.
          </p>
        </>
      )}

      {differences.length > 0 && (
        <>
          {sectionHeading("Differences")}
          {providerTermsLines(differences, (name) => `${name}:`)}
        </>
      )}

      {uniqueInsights.length > 0 && (
        <>
          {sectionHeading("Unique Insights")}
          {providerTermsLines(uniqueInsights, (name) => `Only ${name} mentions:`)}
        </>
      )}

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
