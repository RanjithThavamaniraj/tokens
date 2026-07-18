"use client";

import Link from "next/link";
import Image from "next/image";

export interface OnboardingProviderCard {
  id: string;
  name: string;
  slug: string;
  logo: string;
  connected: boolean;
  comingSoon?: boolean;
}

export default function ProviderStep({
  providers,
}: {
  providers: OnboardingProviderCard[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "clamp(1.6rem, 3vw, 2rem)",
          color: "var(--color-text)",
          margin: 0,
        }}
      >
        Connect Providers
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.95rem",
          color: "var(--color-muted)",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        Tokens uses bring-your-own-key (BYOK). Your API keys stay in this browser
        session and are never uploaded to Tokens. Connect at least one provider
        to run prompts — you can also skip and do this later.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className="flex items-center gap-3 rounded-lg"
            style={{
              background: "var(--color-glass)",
              border: "1px solid var(--color-border)",
              padding: "12px 14px",
            }}
          >
            <Image
              src={provider.logo}
              alt=""
              width={36}
              height={36}
              style={{ borderRadius: 999, flexShrink: 0 }}
            />
            <div className="min-w-0 flex-1">
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "var(--color-text)",
                  margin: 0,
                }}
              >
                {provider.name}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.75rem",
                  color: provider.connected
                    ? "var(--color-accent)"
                    : "var(--color-muted)",
                  marginTop: 2,
                  marginBottom: 0,
                }}
              >
                {provider.comingSoon
                  ? "Coming soon"
                  : provider.connected
                    ? "Connected"
                    : "Not connected"}
              </p>
            </div>
            {!provider.comingSoon && (
              <Link
                href={`/providers/${provider.slug}`}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.75rem",
                  color: "var(--color-text)",
                  textDecoration: "none",
                  border: "1px solid var(--color-border)",
                  borderRadius: 999,
                  padding: "4px 10px",
                  flexShrink: 0,
                }}
              >
                {provider.connected ? "Manage" : "Connect"}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
