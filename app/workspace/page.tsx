"use client";

import { useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import { createProvider } from "@/lib/providers/ProviderFactory";
import type { ProviderId } from "@/lib/providers/Provider";
import { connectionManager } from "@/lib/connections/ConnectionManager";

// This milestone's explicit scope: only OpenAI and Claude need to be
// supported by the workspace runner. This is NOT a general-purpose provider
// list — everywhere else on this page, behavior is driven by the `Provider`
// instances themselves (displayName, executePrompt, ...), never by branching
// on these id strings.
const WORKSPACE_PROVIDER_IDS: ProviderId[] = ["openai", "claude"];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

type ExecutionState = {
  status: "loading" | "done" | "error";
  text?: string;
  error?: string;
};

export default function WorkspacePage() {
  // Stable Provider instances for this milestone's fixed scope. Each id in
  // WORKSPACE_PROVIDER_IDS is guaranteed registered in the factory, so the
  // non-null assertion here is safe.
  const providers = useMemo(
    () =>
      WORKSPACE_PROVIDER_IDS.map((id) => ({
        id,
        provider: createProvider(id)!,
      })),
    [],
  );

  const [selectedIds, setSelectedIds] = useState<Set<ProviderId>>(
    () => new Set(WORKSPACE_PROVIDER_IDS),
  );
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [results, setResults] = useState<
    Partial<Record<ProviderId, ExecutionState>>
  >({});

  function toggleProvider(id: ProviderId) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const canRun = userPrompt.trim() !== "" && selectedIds.size > 0 && !isRunning;

  async function handleRun() {
    if (userPrompt.trim() === "" || selectedIds.size === 0 || isRunning) return;

    const selected = WORKSPACE_PROVIDER_IDS.filter((id) => selectedIds.has(id));

    setHasRun(true);
    setIsRunning(true);
    setResults(
      Object.fromEntries(selected.map((id) => [id, { status: "loading" as const }])),
    );

    await Promise.allSettled(
      selected.map(async (id) => {
        try {
          const connected = await connectionManager.isConnected(id);
          if (!connected) {
            setResults((prev) => ({
              ...prev,
              [id]: {
                status: "error",
                error: "Not connected. Connect this provider first.",
              },
            }));
            return;
          }

          const credentials = await connectionManager.get(id);
          const provider = createProvider(id);
          const result = await provider!.executePrompt({
            systemPrompt: systemPrompt || undefined,
            userPrompt,
            credentials: credentials ?? undefined,
          });
          setResults((prev) => ({
            ...prev,
            [id]: { status: "done", text: result.text },
          }));
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Something went wrong.";
          if (error instanceof Error && error.name === "AuthenticationError") {
            await connectionManager.clear(id);
          }
          setResults((prev) => ({
            ...prev,
            [id]: { status: "error", error: message },
          }));
        }
      }),
    );

    setIsRunning(false);
  }

  const visibleResults = hasRun
    ? WORKSPACE_PROVIDER_IDS.filter((id) => selectedIds.has(id))
    : [];

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
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.78rem",
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--color-accent)",
            }}
          >
            Workspace
          </p>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              color: "var(--color-text)",
              marginTop: 8,
            }}
          >
            Run a prompt across providers
          </h1>
        </motion.div>

        <motion.div
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mx-auto w-full max-w-[640px]"
          style={{ marginTop: "clamp(40px, 6vw, 56px)" }}
        >
          <div className="flex flex-col gap-3">
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.82rem",
                fontWeight: 500,
                color: "var(--color-text)",
              }}
            >
              Providers
            </span>
            <div className="flex flex-col gap-2">
              {providers.map(({ id, provider }) => {
                const checked = selectedIds.has(id);
                return (
                  <label
                    key={id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg"
                    style={{
                      background: "var(--color-glass)",
                      border: "1px solid var(--color-border)",
                      padding: "10px 14px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProvider(id)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className="flex items-center justify-center"
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        border: checked
                          ? "1px solid var(--color-accent)"
                          : "1px solid var(--color-border)",
                        background: checked ? "var(--color-accent)" : "transparent",
                        flexShrink: 0,
                      }}
                    >
                      {checked && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1.5 5L4 7.5L8.5 2"
                            stroke="#06070B"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.9rem",
                        color: "var(--color-text)",
                      }}
                    >
                      {provider.displayName}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <label className="mt-8 flex flex-col gap-2">
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.82rem",
                fontWeight: 500,
                color: "var(--color-text)",
              }}
            >
              System Prompt
            </span>
            <textarea
              value={systemPrompt}
              onChange={(event) => setSystemPrompt(event.target.value)}
              placeholder="Optional instructions to steer every provider's response."
              rows={4}
              className="w-full rounded-lg"
              style={{
                background: "var(--color-glass)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                padding: "10px 14px",
                fontFamily: "var(--font-body)",
                fontSize: "0.85rem",
                minHeight: 120,
                resize: "vertical",
              }}
            />
          </label>

          <label className="mt-6 flex flex-col gap-2">
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.82rem",
                fontWeight: 500,
                color: "var(--color-text)",
              }}
            >
              User Prompt
              <span
                aria-hidden="true"
                style={{ color: "var(--color-accent)", marginLeft: 4 }}
              >
                *
              </span>
            </span>
            <textarea
              value={userPrompt}
              onChange={(event) => setUserPrompt(event.target.value)}
              placeholder="What do you want to ask every selected provider?"
              rows={6}
              className="w-full rounded-lg"
              style={{
                background: "var(--color-glass)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                padding: "10px 14px",
                fontFamily: "var(--font-body)",
                fontSize: "0.85rem",
                minHeight: 160,
                resize: "vertical",
              }}
            />
          </label>

          <button
            type="button"
            onClick={handleRun}
            disabled={!canRun}
            className="mt-8 w-full rounded-full font-semibold"
            style={{
              background: "#EE7B30",
              color: "#06070B",
              padding: "10px 20px",
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              opacity: canRun ? 1 : 0.7,
            }}
          >
            {isRunning ? "Running..." : "Run Prompt"}
          </button>
        </motion.div>

        {visibleResults.length > 0 && (
          <motion.div
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mx-auto w-full max-w-[640px]"
            style={{ marginTop: "clamp(40px, 6vw, 56px)" }}
          >
            <div className="flex flex-col gap-4">
              {visibleResults.map((id) => {
                const provider = providers.find((entry) => entry.id === id)!.provider;
                const result = results[id];
                return (
                  <div
                    key={id}
                    className="rounded-lg"
                    style={{
                      background: "var(--color-glass)",
                      border: "1px solid var(--color-border)",
                      padding: "16px 18px",
                    }}
                  >
                    <h2
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        color: "var(--color-text)",
                      }}
                    >
                      {provider.displayName}
                    </h2>
                    <div style={{ marginTop: 10 }}>
                      {result?.status === "loading" && (
                        <p
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "0.85rem",
                            color: "var(--color-muted)",
                          }}
                        >
                          Running...
                        </p>
                      )}
                      {result?.status === "done" && (
                        <p
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "0.85rem",
                            color: "var(--color-text)",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {result.text}
                        </p>
                      )}
                      {result?.status === "error" && (
                        <p
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "0.85rem",
                            color: "var(--color-muted)",
                          }}
                        >
                          {result.error}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
