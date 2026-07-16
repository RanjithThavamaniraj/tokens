"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

type CodeBlockProps = {
  language?: string;
  value: string;
};

export default function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        border: "1px solid var(--color-border)",
        background: "var(--color-bg)",
        overflow: "hidden",
        margin: "12px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "6px 8px",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-glass)",
        }}
      >
        <button
          type="button"
          onClick={handleCopy}
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.72rem",
            color: "var(--color-text)",
            background: "var(--color-glass)",
            border: "1px solid var(--color-border)",
            borderRadius: 999,
            padding: "4px 10px",
            cursor: "pointer",
          }}
        >
          {copied ? "Copied" : "Copy Code"}
        </button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: "14px 16px",
            background: "transparent",
            fontSize: "0.82rem",
          }}
          wrapLongLines={false}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
