"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import GlobalSearch from "@/components/search/GlobalSearch";

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-5">
      <Link href="/" aria-label="Tokens home">
        <Logo />
      </Link>
      <nav className="flex items-center gap-3" aria-label="Primary">
        <GlobalSearch />
        <Link
          href="/analytics"
          className="rounded-full"
          aria-current={pathname === "/analytics" ? "page" : undefined}
          style={{
            background: "var(--color-glass)",
            border: "1px solid var(--color-border)",
            color: "var(--color-muted)",
            padding: "6px 14px",
            fontFamily: "var(--font-body)",
            fontSize: "0.8rem",
            textDecoration: "none",
          }}
        >
          Insights
        </Link>
        <Link
          href="/settings"
          aria-label="Settings"
          className="rounded-full"
          aria-current={pathname === "/settings" ? "page" : undefined}
          style={{
            background: "var(--color-glass)",
            border: "1px solid var(--color-border)",
            color: "var(--color-muted)",
            padding: "6px 14px",
            fontFamily: "var(--font-body)",
            fontSize: "0.8rem",
            textDecoration: "none",
          }}
        >
          Settings
        </Link>
      </nav>
    </header>
  );
}
