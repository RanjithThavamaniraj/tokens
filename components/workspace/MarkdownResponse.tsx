"use client";

import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import CodeBlock from "@/components/workspace/CodeBlock";

type MarkdownResponseProps = {
  text: string;
};

const SAFE_URL_SCHEMES = ["http:", "https:", "mailto:"];

function isSafeHref(href: string | undefined): boolean {
  if (!href) return false;
  try {
    // Relative/mailto-style values without a scheme (e.g. "mailto:foo") are
    // handled by the URL constructor via a dummy base only when there's no
    // scheme at all; to keep this simple and strict we require an explicit
    // scheme match.
    const schemeMatch = href.match(/^([a-zA-Z][a-zA-Z0-9+.-]*:)/);
    if (!schemeMatch) return false;
    return SAFE_URL_SCHEMES.includes(schemeMatch[1].toLowerCase());
  } catch {
    return false;
  }
}

const components: Components = {
  h1: ({ children }) => (
    <h1
      style={{
        fontFamily: "var(--font-heading)",
        fontSize: "1.3rem",
        color: "var(--color-text)",
        marginTop: 20,
        marginBottom: 10,
        lineHeight: 1.3,
      }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2
      style={{
        fontFamily: "var(--font-heading)",
        fontSize: "1.15rem",
        color: "var(--color-text)",
        marginTop: 18,
        marginBottom: 8,
        lineHeight: 1.3,
      }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      style={{
        fontFamily: "var(--font-heading)",
        fontSize: "1.05rem",
        color: "var(--color-text)",
        marginTop: 16,
        marginBottom: 8,
        lineHeight: 1.35,
      }}
    >
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4
      style={{
        fontFamily: "var(--font-heading)",
        fontSize: "0.95rem",
        color: "var(--color-text)",
        marginTop: 14,
        marginBottom: 6,
        lineHeight: 1.4,
      }}
    >
      {children}
    </h4>
  ),
  h5: ({ children }) => (
    <h5
      style={{
        fontFamily: "var(--font-heading)",
        fontSize: "0.95rem",
        color: "var(--color-text)",
        marginTop: 14,
        marginBottom: 6,
        lineHeight: 1.4,
      }}
    >
      {children}
    </h5>
  ),
  h6: ({ children }) => (
    <h6
      style={{
        fontFamily: "var(--font-heading)",
        fontSize: "0.95rem",
        color: "var(--color-text)",
        marginTop: 14,
        marginBottom: 6,
        lineHeight: 1.4,
      }}
    >
      {children}
    </h6>
  ),
  p: ({ children }) => (
    <p
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "0.85rem",
        color: "var(--color-text)",
        lineHeight: 1.65,
        marginBottom: 10,
      }}
    >
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong style={{ fontWeight: 700, color: "inherit" }}>{children}</strong>
  ),
  em: ({ children }) => (
    <em style={{ fontStyle: "italic", color: "inherit" }}>{children}</em>
  ),
  ul: ({ children }) => (
    <ul
      style={{
        listStyleType: "disc",
        paddingLeft: 22,
        color: "var(--color-text)",
        marginBottom: 10,
      }}
    >
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol
      style={{
        listStyleType: "decimal",
        paddingLeft: 22,
        color: "var(--color-text)",
        marginBottom: 10,
      }}
    >
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "0.85rem",
        lineHeight: 1.6,
        marginBottom: 4,
      }}
    >
      {children}
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote
      style={{
        borderLeft: "2px solid var(--color-accent)",
        paddingLeft: 14,
        color: "var(--color-muted)",
        margin: "10px 0",
      }}
    >
      {children}
    </blockquote>
  ),
  hr: () => (
    <hr
      style={{
        border: "none",
        borderTop: "1px solid var(--color-border)",
        margin: "16px 0",
      }}
    />
  ),
  a: ({ children, href }) => {
    if (isSafeHref(href)) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--color-accent)", textDecoration: "underline" }}
        >
          {children}
        </a>
      );
    }
    return <>{children}</>;
  },
  table: ({ children }) => (
    <div style={{ overflowX: "auto", margin: "10px 0" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.82rem",
        }}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  th: ({ children }) => (
    <th
      style={{
        color: "var(--color-text)",
        fontWeight: 600,
        borderBottom: "1px solid var(--color-border)",
        padding: "8px 12px",
        textAlign: "left",
      }}
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td
      style={{
        color: "var(--color-text)",
        borderBottom: "1px solid var(--color-border)",
        padding: "8px 12px",
      }}
    >
      {children}
    </td>
  ),
  // Fenced code blocks arrive from remark-rehype as <pre><code>...</code></pre>.
  // react-markdown v10 no longer passes an `inline` flag to the `code`
  // component, so the reliable way to distinguish a fenced block from true
  // inline code is to intercept at the `pre` level (inline code is never
  // wrapped in a `pre`).
  pre: ({ children }) => {
    const child = Array.isArray(children) ? children[0] : children;
    const codeProps =
      child && typeof child === "object" && "props" in child
        ? (child.props as { className?: string; children?: unknown })
        : undefined;
    const className = codeProps?.className;
    const match = /language-(\w+)/.exec(className ?? "");
    const rawChildren = codeProps?.children;
    const value = (
      Array.isArray(rawChildren) ? rawChildren.join("") : String(rawChildren ?? "")
    ).replace(/\n$/, "");

    return <CodeBlock language={match?.[1]} value={value} />;
  },
  code: ({ className, children }) => (
    <code
      className={className}
      style={{
        background: "var(--color-glass)",
        border: "1px solid var(--color-border)",
        borderRadius: 4,
        padding: "2px 6px",
        fontFamily: "ui-monospace, monospace",
        fontSize: "0.82em",
        color: "var(--color-accent)",
      }}
    >
      {children}
    </code>
  ),
};

function MarkdownResponse({ text }: MarkdownResponseProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {text}
    </ReactMarkdown>
  );
}

export default memo(MarkdownResponse);
