"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

type ProviderStatus = "Connected" | "Available" | "Coming Soon";

const PROVIDERS: {
  name: string;
  status: ProviderStatus;
  coin: string;
  slug: string;
}[] = [
  { name: "OpenAI", status: "Connected", coin: "/coins/openai.png", slug: "openai" },
  {
    name: "Anthropic Claude",
    status: "Connected",
    coin: "/coins/claude.png",
    slug: "claude",
  },
  {
    name: "Google Gemini",
    status: "Available",
    coin: "/coins/gemini.png",
    slug: "gemini",
  },
  {
    name: "OpenRouter",
    status: "Available",
    coin: "/coins/openrouter.png",
    slug: "openrouter",
  },
  {
    name: "GitHub Copilot",
    status: "Coming Soon",
    coin: "/coins/github-copilot.png",
    slug: "github-copilot",
  },
  {
    name: "Cursor",
    status: "Coming Soon",
    coin: "/coins/cursor.png",
    slug: "cursor",
  },
];

const STATUS_STYLES: Record<ProviderStatus, { dot: string; text: string }> = {
  Connected: { dot: "#EE7B30", text: "var(--color-accent)" },
  Available: { dot: "rgba(248,250,252,0.7)", text: "var(--color-muted)" },
  "Coming Soon": {
    dot: "rgba(248,250,252,0.28)",
    text: "rgba(248,250,252,0.45)",
  },
};

const COIN_MASK =
  "radial-gradient(closest-side, rgba(0,0,0,1) 78%, rgba(0,0,0,0) 100%)";

export default function OneWorkspace() {
  return (
    <section
      id="providers"
      className="mx-auto w-full max-w-[1280px]"
      style={{ padding: "clamp(96px, 14vw, 180px) 0" }}
    >
      <div className="px-5 sm:px-8">
        <div className="mx-auto text-center" style={{ maxWidth: 640 }}>
          <motion.p
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.8rem",
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--color-accent)",
              marginBottom: 16,
            }}
          >
            One Workspace
          </motion.p>

          <motion.h2
            custom={1}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              color: "var(--color-text)",
              marginBottom: 24,
            }}
          >
            Connect your AI providers.
            <br />
            See everything in one place.
          </motion.h2>

          <motion.div
            custom={2}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "clamp(0.9rem, 2.5vw, 1.05rem)",
              lineHeight: 1.65,
              color: "var(--color-muted)",
            }}
          >
            <p style={{ marginBottom: 12 }}>
              Stop opening multiple tabs just to understand your AI usage.
            </p>
            <p>
              Tokens is designed to become the single place where developers
              can connect supported AI providers and monitor their usage from
              one unified workspace.
            </p>
          </motion.div>
        </div>

        <div
          className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-14 sm:gap-y-16"
          style={{ marginTop: "clamp(56px, 8vw, 96px)" }}
        >
          {PROVIDERS.map((provider, i) => (
            <motion.div
              key={provider.name}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                delay: (i % 3) * 0.12 + Math.floor(i / 3) * 0.2,
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Link
                href={`/providers/${provider.slug}`}
                className="group flex flex-col items-center cursor-pointer"
              >
                <motion.div
                  className="relative"
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 5.5 + (i % 3) * 0.9,
                    delay: i * 0.45,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  whileHover={{ scale: 1.06 }}
                  style={{
                    width: "min(56vw, 240px)",
                    height: "min(56vw, 240px)",
                  }}
                >
                  <div
                    className="absolute inset-0 transition-opacity duration-300 ease-out opacity-70 group-hover:opacity-100"
                    aria-hidden="true"
                    style={{
                      background:
                        "radial-gradient(closest-side, rgba(238,123,48,0.16), transparent 72%)",
                      transform: "scale(1.35)",
                    }}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={provider.coin}
                    alt={`${provider.name} token coin`}
                    className="relative h-full w-full object-cover"
                    style={{
                      WebkitMaskImage: COIN_MASK,
                      maskImage: COIN_MASK,
                    }}
                  />
                </motion.div>

                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "clamp(0.95rem, 2vw, 1.1rem)",
                    fontWeight: 600,
                    color: "var(--color-text)",
                    marginTop: 20,
                  }}
                >
                  {provider.name}
                </p>
                <p
                  className="flex items-center gap-2"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.78rem",
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: STATUS_STYLES[provider.status].text,
                    marginTop: 8,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: STATUS_STYLES[provider.status].dot,
                    }}
                  />
                  {provider.status}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
