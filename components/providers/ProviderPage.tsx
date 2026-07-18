"use client";

import { useState, type ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Tabs from "@/components/providers/Tabs";
import OverviewSection from "@/components/providers/OverviewSection";
import ModelsSection from "@/components/providers/ModelsSection";
import EmptyState from "@/components/providers/EmptyState";
import IntegrationPanel from "@/components/providers/IntegrationPanel";
import {
  CAPABILITY_LABELS,
  type ProviderCapabilities,
  type ProviderId,
  type ProviderIntegration,
  type ProviderModel,
  type ProviderOverview,
  type ProviderStatus,
} from "@/lib/providers/Provider";

// Fixed key order for capability-derived tabs (matches ProviderCapabilities).
const CAPABILITY_ORDER: (keyof ProviderCapabilities)[] = [
  "models",
  "usage",
  "billing",
  "projects",
  "organizations",
  "rateLimits",
  "embeddings",
  "images",
  "responses",
  "files",
  "fineTuning",
  "assistants",
  "conversations",
];

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
  providerId: ProviderId;
  name: string;
  statusLabel: string;
  status: ProviderStatus;
  overview: ProviderOverview;
  coinSrc: string;
  capabilities: ProviderCapabilities;
  integration: ProviderIntegration;
};

export default function ProviderPage({
  providerId,
  name,
  statusLabel,
  status,
  overview,
  coinSrc,
  capabilities,
  integration,
}: ProviderPageProps) {
  // "Overview" is Tokens' own connection-status presentation, not a provider
  // API capability, so it's always first and not derived from `capabilities`.
  const capabilityTabs = CAPABILITY_ORDER.filter(
    (key) => capabilities[key],
  ).map((key) => ({ key, label: CAPABILITY_LABELS[key] }));
  const tabs = ["Overview", ...capabilityTabs.map((tab) => tab.label)];

  const [activeTab, setActiveTab] = useState<string>("Overview");
  const [models, setModels] = useState<ProviderModel[] | null>(null);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);

  function handleDisconnect() {
    setModels(null);
    setModelsError(null);
  }

  const activeCapabilityTab = capabilityTabs.find(
    (tab) => tab.label === activeTab,
  );

  let tabContent: ReactNode = null;
  if (activeTab === "Overview") {
    tabContent = <OverviewSection overview={overview} />;
  } else if (activeTab === "Models" && capabilities.models) {
    tabContent = (
      <ModelsSection models={models} error={modelsError} loading={modelsLoading} />
    );
  } else if (activeCapabilityTab) {
    tabContent = (
      <EmptyState
        text={`No ${activeCapabilityTab.label.toLowerCase()} available until your account is connected.`}
      />
    );
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
            <Image
              src={coinSrc}
              alt={`${name} token coin`}
              width={1024}
              height={1024}
              sizes="(max-width: 393px) 56vw, 220px"
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

          <IntegrationPanel
            providerId={providerId}
            integration={integration}
            onModelsResult={(result) => {
              if ("models" in result) {
                setModels(result.models);
                setModelsError(null);
              } else {
                setModelsError(result.error);
              }
            }}
            onDisconnect={handleDisconnect}
            onModelsLoadingChange={setModelsLoading}
          />
        </div>

        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          style={{ marginTop: "clamp(56px, 8vw, 80px)" }}
        >
          <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

          <div
            role="tabpanel"
            id="provider-tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            style={{ marginTop: 24 }}
          >
            {tabContent}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
