import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

const KNOWN_SLUGS = [
  "claude",
  "gemini",
  "openrouter",
  "github-copilot",
  "cursor",
] as const;

export function generateStaticParams() {
  return KNOWN_SLUGS.map((slug) => ({ slug }));
}

export default async function ProviderComingSoonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!KNOWN_SLUGS.includes(slug as (typeof KNOWN_SLUGS)[number])) {
    notFound();
  }

  return (
    <main
      style={{
        fontFamily: "var(--font-body)",
        color: "var(--color-text)",
        background: "var(--color-bg)",
        minHeight: "100vh",
      }}
    >
      <Navbar />

      <div
        className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-center px-5 text-center sm:px-8"
        style={{ minHeight: "calc(100vh - 88px)" }}
      >
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(2rem, 5vw, 3rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
            color: "var(--color-text)",
          }}
        >
          Coming Soon
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.95rem",
            color: "var(--color-muted)",
            marginTop: 16,
          }}
        >
          This provider isn&apos;t connected yet.
        </p>
        <Link
          href="/"
          className="rounded-full"
          style={{
            marginTop: 32,
            background: "transparent",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
            padding: "10px 20px",
            fontFamily: "var(--font-body)",
            fontSize: "0.9rem",
          }}
        >
          Back home
        </Link>
      </div>
    </main>
  );
}
