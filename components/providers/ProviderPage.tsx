"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Tabs, { type TabName } from "@/components/providers/Tabs";
import OverviewSection from "@/components/providers/OverviewSection";
import ModelsSection from "@/components/providers/ModelsSection";
import EmptyState from "@/components/providers/EmptyState";
import type {
  ProviderOverview,
  ProviderStatus,
} from "@/lib/providers/Provider";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const COIN_MASK =
  "radial-gradient(closest-side, rgba(0,0,0,1) 78%, rgba(0,0,0,0) 100%)";

const STATUS_STYLES: Record<ProviderStatus, { dot: string; text: string }> = {
  connected: { dot: "#EE7B30", text: "var(--color-accent)" },
  available: { dot: "rgba(248,250,252,0.7)", text: "var(--color-muted)" },
  disconnected: {
    dot: "rgba(248,250,252,0.28)",
    text: "rgba(248,250,252,0.45)",
  },
  "coming-soon": {
    dot: "rgba(248,250,252,0.28)",
    text: "rgba(248,250,252,0.45)",
  },
};

export type ProviderPageProps = {
  name: string;
  statusLabel: string;
  status: ProviderStatus;
  overview: ProviderOverview;
  coinSrc: string;
};

export default function ProviderPage({
  name,
  statusLabel,
  status,
  overview,
  coinSrc,
}: ProviderPageProps) {
  const [activeTab, setActiveTab] = useState<TabName>("Overview");

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
        className="mx-auto w-full max-w-[1280px] px-5 sm:px-8"
        style={{ paddingTop: "clamp(48px, 8vw, 96px)", paddingBottom: 96 }}
      >
        <div className="flex flex-col items-center text-center">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="relative"
            style={{ width: "min(56vw, 220px)", height: "min(56vw, 220px)" }}
          >
            <div
              className="absolute inset-0"
              aria-hidden="true"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(238,123,48,0.16), transparent 72%)",
                transform: "scale(1.35)",
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coinSrc}
              alt={`${name} token coin`}
              className="relative h-full w-full object-cover"
              style={{
                WebkitMaskImage: COIN_MASK,
                maskImage: COIN_MASK,
              }}
            />
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              color: "var(--color-text)",
              marginTop: 28,
            }}
          >
            {name}
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-2"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.78rem",
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: STATUS_STYLES[status].text,
              marginTop: 14,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: STATUS_STYLES[status].dot,
              }}
            />
            {statusLabel}
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-3"
            style={{ marginTop: 32 }}
          >
            <button
              type="button"
              className="rounded-full font-semibold"
              style={{
                background: "#EE7B30",
                color: "#06070B",
                padding: "10px 20px",
                fontFamily: "var(--font-body)",
                fontSize: "0.9rem",
              }}
            >
              Manage Connection
            </button>
            <button
              type="button"
              className="rounded-full"
              style={{
                background: "transparent",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                padding: "10px 20px",
                fontFamily: "var(--font-body)",
                fontSize: "0.9rem",
              }}
            >
              Disconnect
            </button>
          </motion.div>
        </div>

        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          style={{ marginTop: "clamp(56px, 8vw, 80px)" }}
        >
          <Tabs active={activeTab} onChange={setActiveTab} />

          <div style={{ marginTop: 24 }}>
            {activeTab === "Overview" && (
              <OverviewSection overview={overview} />
            )}
            {activeTab === "Models" && <ModelsSection />}
            {activeTab === "Usage" && <EmptyState text="No usage available." />}
            {activeTab === "Billing" && <EmptyState text="Coming Soon" />}
            {activeTab === "Conversations" && (
              <EmptyState text="Coming Soon" />
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
