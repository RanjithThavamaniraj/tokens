"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { connectionManager } from "@/lib/connections/ConnectionManager";
import { createProvider } from "@/lib/providers/ProviderFactory";
import type { ProviderId } from "@/lib/providers/Provider";
import { projectRepository } from "@/lib/projects/ProjectRepository";
import { onboardingService } from "@/lib/onboarding/OnboardingService";
import {
  EXAMPLE_PROMPTS,
  ONBOARDING_STEPS,
} from "@/lib/onboarding/types";
import WelcomeStep from "./WelcomeStep";
import ProviderStep, { type OnboardingProviderCard } from "./ProviderStep";
import ProjectStep from "./ProjectStep";
import PromptStep from "./PromptStep";
import DecisionStep from "./DecisionStep";
import FinishStep from "./FinishStep";

const PROVIDER_IDS: ProviderId[] = [
  "openai",
  "claude",
  "gemini",
  "grok",
  "perplexity",
  "mistral",
];

const STEP_IDS = ONBOARDING_STEPS.map((step) => step.id);

export default function OnboardingWizard() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(() => {
    if (typeof window === "undefined") return 0;
    const stored = window.sessionStorage.getItem("tokens:onboarding:step");
    if (!stored) return 0;
    try {
      const index = parseInt(stored, 10);
      return Math.max(0, Math.min(index, STEP_IDS.length - 1));
    } catch {
      return 0;
    }
  });
  const [providers, setProviders] = useState<OnboardingProviderCard[]>([]);
  const [projectName, setProjectName] = useState("My Project");
  const [createdProjectName, setCreatedProjectName] = useState<string | null>(
    null,
  );
  const [prompt, setPrompt] = useState<string>(EXAMPLE_PROMPTS[0].prompt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepId = STEP_IDS[stepIndex] ?? "welcome";
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEP_IDS.length - 1;

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem("tokens:onboarding:step", String(stepIndex));
  }, [stepIndex]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      PROVIDER_IDS.map(async (id): Promise<OnboardingProviderCard | null> => {
        const provider = createProvider(id);
        if (!provider) return null;
        const connected = await connectionManager.isConnected(id);
        return {
          id,
          name: provider.displayName,
          slug: id,
          logo: provider.logo,
          connected,
          comingSoon: false,
        };
      }),
    ).then((rows) => {
      if (cancelled) return;
      setProviders(
        rows.filter((row): row is OnboardingProviderCard => row !== null),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [stepId]);

  const progressLabel = useMemo(
    () => `Step ${stepIndex + 1} of ${STEP_IDS.length}`,
    [stepIndex],
  );

  async function finishOnboarding(navigateTo?: string) {
    setBusy(true);
    setError(null);
    try {
      if (prompt.trim()) {
        onboardingService.stashPrompt({ userPrompt: prompt.trim() });
      }
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("tokens:onboarding:step");
      }
      await onboardingService.complete();
      router.push(navigateTo ?? "/workspace");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to finish onboarding.");
      setBusy(false);
    }
  }

  async function handleSkip() {
    await finishOnboarding("/workspace");
  }

  async function handleNext() {
    setError(null);

    if (stepId === "project") {
      const name = projectName.trim() || "My Project";
      if (!createdProjectName) {
        setBusy(true);
        try {
          const stored = await projectRepository.create(name);
          await projectRepository.setActive(stored.project.id);
          setCreatedProjectName(stored.project.name);
          setProjectName(stored.project.name);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Unable to create project.",
          );
          setBusy(false);
          return;
        }
        setBusy(false);
      }
    }

    if (stepId === "prompt" && prompt.trim()) {
      onboardingService.stashPrompt({ userPrompt: prompt.trim() });
    }

    if (isLast) {
      await finishOnboarding("/workspace");
      return;
    }

    setStepIndex((index) => Math.min(index + 1, STEP_IDS.length - 1));
  }

  function handleBack() {
    setError(null);
    setStepIndex((index) => Math.max(index - 1, 0));
  }

  return (
    <div
      className="mx-auto w-full max-w-[720px] rounded-lg"
      style={{
        background: "var(--color-glass)",
        border: "1px solid var(--color-border)",
        padding: "clamp(20px, 4vw, 32px)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          role="status"
          aria-live="polite"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.78rem",
            color: "var(--color-muted)",
            margin: 0,
          }}
        >
          {progressLabel}
        </p>
        {!isLast && (
          <button
            type="button"
            onClick={() => {
              void handleSkip();
            }}
            disabled={busy}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.78rem",
              color: "var(--color-muted)",
              background: "transparent",
              border: "none",
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            Skip
          </button>
        )}
      </div>

      <div className="mt-4 flex gap-1.5" aria-hidden="true">
        {STEP_IDS.map((id, index) => (
          <div
            key={id}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 999,
              background:
                index <= stepIndex
                  ? "var(--color-accent)"
                  : "var(--color-border)",
            }}
          />
        ))}
      </div>

      <div style={{ marginTop: 28 }}>
        {stepId === "welcome" && <WelcomeStep />}
        {stepId === "providers" && <ProviderStep providers={providers} />}
        {stepId === "project" && (
          <ProjectStep
            name={projectName}
            onChange={setProjectName}
            createdName={createdProjectName}
          />
        )}
        {stepId === "prompt" && (
          <PromptStep prompt={prompt} onChange={setPrompt} />
        )}
        {stepId === "decision" && <DecisionStep />}
        {stepId === "finish" && (
          <FinishStep
            onWorkspace={() => {
              void finishOnboarding("/workspace");
            }}
            onDocs={() => {
              void finishOnboarding("/settings#about");
            }}
          />
        )}
      </div>

      {error && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.8rem",
            color: "var(--color-accent)",
            marginTop: 16,
          }}
        >
          {error}
        </p>
      )}

      {stepId !== "finish" && (
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={isFirst || busy}
            className="rounded-full font-semibold"
            style={{
              background: "transparent",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
              padding: "10px 18px",
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              opacity: isFirst || busy ? 0.5 : 1,
              cursor: isFirst || busy ? "not-allowed" : "pointer",
            }}
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              void handleNext();
            }}
            disabled={busy}
            className="rounded-full font-semibold"
            style={{
              background: "#EE7B30",
              color: "#06070B",
              padding: "10px 18px",
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              opacity: busy ? 0.7 : 1,
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            {busy
              ? "Working…"
              : isFirst
                ? "Get Started"
                : stepId === "project" && !createdProjectName
                  ? "Create & Continue"
                  : "Next"}
          </button>
        </div>
      )}
    </div>
  );
}
