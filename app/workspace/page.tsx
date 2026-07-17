"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import { createProvider } from "@/lib/providers/ProviderFactory";
import type {
  Message,
  ProviderId,
  ProviderModel,
  ProviderTokenUsage,
} from "@/lib/providers/Provider";
import { connectionManager } from "@/lib/connections/ConnectionManager";
import MarkdownResponse from "@/components/workspace/MarkdownResponse";
import PromptLibraryPanel from "@/components/workspace/PromptLibraryPanel";
import ConsensusCard from "@/components/workspace/ConsensusCard";
import {
  buildComparisonSummary,
  computeResponseStats,
  type ComparisonEntry,
} from "@/lib/workspace/responseStats";
import { computeConsensusV2, type ConsensusResponse } from "@/lib/workspace/consensus";
import type { LibraryPrompt } from "@/lib/prompts/PromptLibrary";
import ReviewDialog from "@/components/workspace/ReviewDialog";
import ReviewResult from "@/components/workspace/ReviewResult";
import {
  buildReviewMessages,
  reviewFocusLabel,
  type ReviewFocus,
} from "@/lib/workspace/review";
import DebatePanel, {
  type DebateRound1EntryView,
  type DebateRound2EntryView,
} from "@/components/workspace/DebatePanel";
import {
  buildDebateReviewMessages,
  buildRebuttalMessages,
  canStartDebate,
  computeDebateRing,
  type DebateParticipant,
} from "@/lib/workspace/debate";
import RecommendationPanel from "@/components/workspace/RecommendationPanel";
import {
  buildRecommendationMessages,
  canGenerateRecommendation,
  type RecommendationState,
} from "@/lib/workspace/recommendation";
import ProjectsSidebar from "@/components/workspace/ProjectsSidebar";
import {
  emptyProjectWorkspace,
  projectRepository,
  type Project,
  type ProjectWorkspaceState,
} from "@/lib/projects/ProjectRepository";
import {
  consumeSearchNavigation,
  SEARCH_NAVIGATE_EVENT,
} from "@/lib/search/SearchEngine";
import ExportDialog from "@/components/export/ExportDialog";
import type { ExportSource } from "@/lib/export/types";
import { useSettings } from "@/lib/settings/SettingsContext";
import { useRouter } from "next/navigation";
import { onboardingService } from "@/lib/onboarding/OnboardingService";

// Real, executable providers supported by the workspace runner. Behavior is
// driven by Provider instances; this fixed order only controls presentation.
const WORKSPACE_PROVIDER_IDS: ProviderId[] = [
  "openai",
  "claude",
  "gemini",
  "grok",
  "perplexity",
];

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
  error?: string;
  // The user message currently in flight. Rendered as a pending bubble in
  // the thread while loading; only committed to the conversation on success.
  pendingUser?: string;
  streamedText?: string;
  usage?: ProviderTokenUsage;
  stopped?: boolean;
};

type ReviewEntry = {
  reviewerId: ProviderId;
  focus: ReviewFocus;
  status: "loading" | "done" | "error";
  text?: string;
  error?: string;
};

type DebateRoundEntryState = {
  key: string;
  status: "loading" | "done" | "error";
  text?: string;
  error?: string;
};

type DebateState = {
  status: "round1" | "round2" | "complete";
  round1: (DebateRoundEntryState & {
    reviewerId: ProviderId;
    revieweeId: ProviderId;
    reviewerDisplayName: string;
    revieweeDisplayName: string;
  })[];
  round2: (DebateRoundEntryState & {
    providerId: ProviderId;
    providerDisplayName: string;
  })[];
};

// The newest assistant turn drives Copy Response and the comparison stats,
// preserving their pre-conversation semantics of "the provider's response".
function lastAssistantText(messages: Message[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") return messages[i].content;
  }
  return null;
}

function formatTokenUsage(usage?: ProviderTokenUsage): string | null {
  if (!usage) return null;
  const total =
    usage.totalTokens ??
    (usage.inputTokens !== undefined && usage.outputTokens !== undefined
      ? usage.inputTokens + usage.outputTokens
      : undefined);
  if (total === undefined) return null;
  const breakdown =
    usage.inputTokens !== undefined && usage.outputTokens !== undefined
      ? ` (${usage.inputTokens.toLocaleString()} in / ${usage.outputTokens.toLocaleString()} out)`
      : "";
  return `${total.toLocaleString()} tokens${breakdown}`;
}

export default function WorkspacePage() {
  const router = useRouter();
  const { settings } = useSettings();

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

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState("");
  const [projectsHydrated, setProjectsHydrated] = useState(false);
  const skipNextProjectSaveRef = useRef(false);
  const projectSaveTimeoutRef = useRef<number | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<ProviderId>>(
    () => new Set(WORKSPACE_PROVIDER_IDS),
  );
  const [availableModels, setAvailableModels] = useState<
    Partial<Record<ProviderId, ProviderModel[]>>
  >({});
  const [selectedModelIds, setSelectedModelIds] = useState<
    Partial<Record<ProviderId, string>>
  >(() =>
    Object.fromEntries(
      providers.map(({ id, provider }) => [
        id,
        settings.defaultModelIds[id] ?? provider.defaultModelId,
      ]),
    ),
  );
  const [modelsLoadingIds, setModelsLoadingIds] = useState<Set<ProviderId>>(
    new Set(),
  );
  const [modelErrors, setModelErrors] = useState<
    Partial<Record<ProviderId, string>>
  >({});
  const abortControllersRef = useRef<
    Partial<Record<ProviderId, AbortController>>
  >({});
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [results, setResults] = useState<
    Partial<Record<ProviderId, ExecutionState>>
  >({});
  // One independent conversation per provider, session-only. Keyed by
  // provider id so no provider can ever see another provider's history.
  const [conversations, setConversations] = useState<
    Partial<Record<ProviderId, Message[]>>
  >({});
  const [copiedId, setCopiedId] = useState<ProviderId | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<ProviderId>>(new Set());
  // In-place editing of the latest user message, one provider at a time.
  const [editing, setEditing] = useState<{
    id: ProviderId;
    text: string;
  } | null>(null);

  // Reviews are fully independent of `conversations` — never appended as a
  // conversation turn, never sent as history on a future turn. Modeled as an
  // array per provider (even though only the latest is shown) so a future
  // multi-round Debate mode can append entries without a data-shape change.
  const [reviews, setReviews] = useState<
    Partial<Record<ProviderId, ReviewEntry[]>>
  >({});
  const [reviewDialogFor, setReviewDialogFor] = useState<ProviderId | null>(
    null,
  );
  const [reviewCollapsedIds, setReviewCollapsedIds] = useState<
    Set<ProviderId>
  >(new Set());
  const [reviewCopiedId, setReviewCopiedId] = useState<ProviderId | null>(null);

  // Debate orchestration is entirely separate from `conversations` — it never
  // calls setConversations, and clearing/discarding a debate never touches any
  // provider's conversation history.
  const [debate, setDebate] = useState<DebateState | null>(null);
  const [debateCollapsedKeys, setDebateCollapsedKeys] = useState<Set<string>>(
    new Set(),
  );
  const [debateCopiedKey, setDebateCopiedKey] = useState<string | null>(null);

  // Final recommendation is fully independent of conversations, reviews,
  // debate, and consensus — those features are inputs only. Session-only
  // React state; never appended to any provider conversation.
  const [recommendationProviderId, setRecommendationProviderId] =
    useState<ProviderId>(
      () =>
        (WORKSPACE_PROVIDER_IDS.includes(
          settings.defaultProviderId as ProviderId,
        )
          ? settings.defaultProviderId
          : "openai") as ProviderId,
    );
  const [recommendation, setRecommendation] =
    useState<RecommendationState | null>(null);
  const [recommendationCollapsed, setRecommendationCollapsed] = useState(false);
  const [recommendationCopied, setRecommendationCopied] = useState(false);

  // Global Search navigation: transient scroll-and-highlight target consumed
  // from the search modal. Presentation only — never touches execution,
  // conversations, or persistence.
  const [searchHighlightAnchor, setSearchHighlightAnchor] = useState<
    string | null
  >(null);
  const searchHighlightTimeoutRef = useRef<number | null>(null);
  const searchNavigationRef = useRef<() => void>(() => {});
  const createProjectRef = useRef<(name: string) => void>(() => {});
  const [exportOpen, setExportOpen] = useState(false);

  const buildProjectSnapshot = useCallback((): ProjectWorkspaceState => {
    const completedReviews = Object.fromEntries(
      Object.entries(reviews).map(([providerId, entries]) => [
        providerId,
        (entries ?? []).filter(
          (entry) => entry.status === "done" || entry.status === "error",
        ),
      ]),
    ) as ProjectWorkspaceState["reviews"];

    const completedDebate =
      debate?.status === "complete"
        ? {
            status: "complete" as const,
            round1: debate.round1.map((entry) => ({
              ...entry,
              status:
                entry.status === "done"
                  ? ("done" as const)
                  : ("error" as const),
            })),
            round2: debate.round2.map((entry) => ({
              ...entry,
              status:
                entry.status === "done"
                  ? ("done" as const)
                  : ("error" as const),
            })),
          }
        : null;

    return {
      selectedProviderIds: [...selectedIds],
      selectedModelIds,
      responseUsage: Object.fromEntries(
        Object.entries(results)
          .filter(([, result]) => result?.usage)
          .map(([providerId, result]) => [providerId, result!.usage!]),
      ),
      stoppedProviderIds: Object.entries(results)
        .filter(([, result]) => result?.stopped)
        .map(([providerId]) => providerId as ProviderId),
      systemPrompt,
      userPrompt,
      conversations,
      reviews: completedReviews,
      debate: completedDebate,
      recommendationProviderId,
      recommendation:
        recommendation?.status === "done" ? recommendation : null,
    };
  }, [
    conversations,
    debate,
    recommendation,
    recommendationProviderId,
    reviews,
    results,
    selectedIds,
    selectedModelIds,
    systemPrompt,
    userPrompt,
  ]);

  const applyProjectSnapshot = useCallback(
    (snapshot: ProjectWorkspaceState) => {
      const selected = snapshot.selectedProviderIds.filter((id) =>
        WORKSPACE_PROVIDER_IDS.includes(id),
      );
      setSelectedIds(
        new Set(selected.length > 0 ? selected : WORKSPACE_PROVIDER_IDS),
      );
      setSelectedModelIds({
        ...Object.fromEntries(
          providers.map(({ id, provider }) => [id, provider.defaultModelId]),
        ),
        ...snapshot.selectedModelIds,
      });
      setSystemPrompt(snapshot.systemPrompt);
      setUserPrompt(snapshot.userPrompt);
      setConversations(snapshot.conversations);
      setReviews(snapshot.reviews as Partial<Record<ProviderId, ReviewEntry[]>>);
      setDebate(snapshot.debate as DebateState | null);
      setRecommendationProviderId(snapshot.recommendationProviderId);
      setRecommendation(snapshot.recommendation);

      const completedResults = Object.fromEntries(
        Object.entries(snapshot.conversations)
          .filter(([, messages]) => messages && messages.length > 0)
          .map(([providerId]) => [
            providerId,
            {
              status: "done" as const,
              usage: snapshot.responseUsage[providerId as ProviderId],
              stopped: snapshot.stoppedProviderIds.includes(
                providerId as ProviderId,
              ),
            },
          ]),
      ) as Partial<Record<ProviderId, ExecutionState>>;
      setResults(completedResults);
      setHasRun(Object.keys(completedResults).length > 0);

      setIsRunning(false);
      setCopiedId(null);
      setCollapsedIds(new Set());
      setEditing(null);
      setReviewDialogFor(null);
      setReviewCollapsedIds(new Set());
      setReviewCopiedId(null);
      setDebateCollapsedKeys(new Set());
      setDebateCopiedKey(null);
      setRecommendationCollapsed(false);
      setRecommendationCopied(false);
    },
    [providers],
  );

  useEffect(() => {
    let cancelled = false;

    void projectRepository.initialize().then((session) => {
      if (cancelled) return;
      skipNextProjectSaveRef.current = true;
      setProjects(session.projects);
      setActiveProjectId(session.activeProjectId);
      applyProjectSnapshot(session.workspace);

      const handoff = onboardingService.consumePrompt();
      if (handoff) {
        if (handoff.systemPrompt !== undefined) {
          setSystemPrompt(handoff.systemPrompt);
        }
        setUserPrompt(handoff.userPrompt);
      }

      setProjectsHydrated(true);
    });

    return () => {
      cancelled = true;
    };
  }, [applyProjectSnapshot]);

  useEffect(() => {
    if (!projectsHydrated || !activeProjectId) return;
    if (skipNextProjectSaveRef.current) {
      skipNextProjectSaveRef.current = false;
      return;
    }

    projectSaveTimeoutRef.current = window.setTimeout(() => {
      void projectRepository
        .save(activeProjectId, buildProjectSnapshot())
        .then((updated) => {
          if (!updated) return;
          setProjects((current) =>
            current.map((project) =>
              project.id === updated.id ? updated : project,
            ),
          );
        });
    }, 250);

    return () => {
      if (projectSaveTimeoutRef.current !== null) {
        window.clearTimeout(projectSaveTimeoutRef.current);
        projectSaveTimeoutRef.current = null;
      }
    };
  }, [
    activeProjectId,
    buildProjectSnapshot,
    projectsHydrated,
  ]);

  useEffect(() => {
    if (!projectsHydrated) return;
    let cancelled = false;

    setModelsLoadingIds(new Set(WORKSPACE_PROVIDER_IDS));
    void Promise.all(
      providers.map(async ({ id, provider }) => {
        try {
          const credentials = await connectionManager.get(id);
          if (!credentials) return;
          const models = await provider.getModels(credentials);
          if (cancelled) return;
          setAvailableModels((current) => ({ ...current, [id]: models }));
          setSelectedModelIds((current) => {
            const selected = current[id];
            if (selected && models.some((model) => model.id === selected)) {
              return current;
            }
            const nextModel =
              models.find((model) => model.id === provider.defaultModelId)?.id ??
              models[0]?.id ??
              provider.defaultModelId;
            return nextModel ? { ...current, [id]: nextModel } : current;
          });
          setModelErrors((current) => {
            const next = { ...current };
            delete next[id];
            return next;
          });
        } catch (error) {
          if (cancelled) return;
          if (error instanceof Error && error.name === "AuthenticationError") {
            await connectionManager.clear(id);
          }
          setModelErrors((current) => ({
            ...current,
            [id]:
              error instanceof Error
                ? error.message
                : "Unable to load models.",
          }));
        } finally {
          if (!cancelled) {
            setModelsLoadingIds((current) => {
              const next = new Set(current);
              next.delete(id);
              return next;
            });
          }
        }
      }),
    );

    return () => {
      cancelled = true;
    };
  }, [projectsHydrated, providers]);

  // Auto-scroll: only follow new messages when the user is already near the
  // page bottom. Tracked continuously so a user who scrolled up to read
  // older turns is never force-scrolled.
  const nearBottomRef = useRef(true);

  useEffect(() => {
    function updateNearBottom() {
      const remaining =
        document.documentElement.scrollHeight -
        (window.scrollY + window.innerHeight);
      nearBottomRef.current = remaining < 150;
    }
    updateNearBottom();
    window.addEventListener("scroll", updateNearBottom, { passive: true });
    return () => window.removeEventListener("scroll", updateNearBottom);
  }, []);

  useEffect(() => {
    if (!nearBottomRef.current) return;
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  }, [conversations, results]);

  async function handleCopyResponse(id: ProviderId, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000);
  }

  function toggleCollapsed(id: ProviderId) {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleReviewCollapsed(id: ProviderId) {
    setReviewCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCopyReview(id: ProviderId, text: string) {
    await navigator.clipboard.writeText(text);
    setReviewCopiedId(id);
    setTimeout(
      () => setReviewCopiedId((current) => (current === id ? null : current)),
      2000,
    );
  }

  // Runs a single, stateless review pass: `reviewerId` reviews `revieweeId`'s
  // latest response. This calls the SAME executePrompt() capability every
  // other feature uses, with a one-off message array (no conversation
  // history in, no conversation history out) — it never touches
  // `conversations`, so the reviewed response and its thread are unaffected.
  async function runReview(
    revieweeId: ProviderId,
    reviewerId: ProviderId,
    focus: ReviewFocus,
  ) {
    if (reviewerId === revieweeId) return; // defensive; UI already excludes this

    const conversation = conversations[revieweeId] ?? [];
    const assistantIndex = conversation.length - 1;
    const last = conversation[assistantIndex];
    if (last?.role !== "assistant") return;
    const previous = conversation[assistantIndex - 1];
    const originalUserPrompt =
      previous?.role === "user" ? previous.content : "";
    const originalResponseText = last.content;

    setReviewDialogFor(null);
    setReviews((prev) => ({
      ...prev,
      [revieweeId]: [
        ...(prev[revieweeId] ?? []),
        { reviewerId, focus, status: "loading" },
      ],
    }));

    try {
      const connected = await connectionManager.isConnected(reviewerId);
      if (!connected) {
        setReviews((prev) => ({
          ...prev,
          [revieweeId]: [
            ...(prev[revieweeId] ?? []).slice(0, -1),
            {
              reviewerId,
              focus,
              status: "error",
              error: "Not connected. Connect this provider first.",
            },
          ],
        }));
        return;
      }
      const credentials = await connectionManager.get(reviewerId);
      const reviewer = createProvider(reviewerId);
      const result = await reviewer!.executePrompt({
        messages: buildReviewMessages(
          originalUserPrompt,
          originalResponseText,
          focus,
        ),
        credentials: credentials ?? undefined,
        modelId: selectedModelIds[reviewerId],
      });
      setReviews((prev) => ({
        ...prev,
        [revieweeId]: [
          ...(prev[revieweeId] ?? []).slice(0, -1),
          { reviewerId, focus, status: "done", text: result.text },
        ],
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      if (error instanceof Error && error.name === "AuthenticationError") {
        await connectionManager.clear(reviewerId);
      }
      setReviews((prev) => ({
        ...prev,
        [revieweeId]: [
          ...(prev[revieweeId] ?? []).slice(0, -1),
          { reviewerId, focus, status: "error", error: message },
        ],
      }));
    }
  }

  function toggleDebateCollapsed(key: string) {
    setDebateCollapsedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  async function handleCopyDebateEntry(key: string, text: string) {
    await navigator.clipboard.writeText(text);
    setDebateCopiedKey(key);
    setTimeout(
      () => setDebateCopiedKey((current) => (current === key ? null : current)),
      2000,
    );
  }

  async function handleCopyRecommendation(text: string) {
    await navigator.clipboard.writeText(text);
    setRecommendationCopied(true);
    setTimeout(() => setRecommendationCopied(false), 2000);
  }

  // Exactly ONE additional provider request. Builds a synthesis prompt from
  // already-computed in-memory results and calls the user-selected provider
  // via callProviderOnce — never touches conversations, reviews, debate, or
  // consensus state.
  async function runRecommendation() {
    const providerResponses = visibleResults
      .map((id) => {
        const text = lastAssistantText(conversations[id] ?? []);
        if (!text) return null;
        const provider = providers.find((entry) => entry.id === id)!.provider;
        return {
          id: id as string,
          displayName: provider.displayName,
          text,
        };
      })
      .filter(
        (entry): entry is { id: string; displayName: string; text: string } =>
          entry !== null,
      );

    const validation = canGenerateRecommendation(providerResponses.length);
    if (!validation.ok) return;
    if (recommendation?.status === "loading") return;

    const consensus = computeConsensusV2(providerResponses);

    const originalUserPrompt =
      providerResponses
        .map((response) => {
          const conversation =
            conversations[response.id as ProviderId] ?? [];
          const last = conversation[conversation.length - 1];
          if (last?.role !== "assistant") return "";
          const prev = conversation[conversation.length - 2];
          return prev?.role === "user" ? prev.content : "";
        })
        .find((prompt) => prompt.length > 0) ?? userPrompt.trim();

    const completedReviews = visibleResults.flatMap((id) => {
      const providerReviews = reviews[id] ?? [];
      const latest = providerReviews[providerReviews.length - 1];
      if (!latest || latest.status !== "done" || !latest.text) return [];
      const reviewee = providers.find((entry) => entry.id === id)!.provider;
      const reviewer = providers.find(
        (entry) => entry.id === latest.reviewerId,
      )!.provider;
      return [
        {
          revieweeDisplayName: reviewee.displayName,
          reviewerDisplayName: reviewer.displayName,
          focusLabel: reviewFocusLabel(latest.focus),
          text: latest.text,
        },
      ];
    });

    const debateInput =
      debate && debate.status === "complete"
        ? {
            critiques: debate.round1
              .filter((entry) => entry.status === "done" && entry.text)
              .map((entry) => ({
                reviewerDisplayName: entry.reviewerDisplayName,
                revieweeDisplayName: entry.revieweeDisplayName,
                text: entry.text!,
              })),
            rebuttals: debate.round2
              .filter((entry) => entry.status === "done" && entry.text)
              .map((entry) => ({
                providerDisplayName: entry.providerDisplayName,
                text: entry.text!,
              })),
          }
        : undefined;

    const messages = buildRecommendationMessages({
      originalUserPrompt,
      providerResponses,
      consensus,
      reviews: completedReviews.length > 0 ? completedReviews : undefined,
      debate:
        debateInput &&
        (debateInput.critiques.length > 0 || debateInput.rebuttals.length > 0)
          ? debateInput
          : undefined,
    });

    setRecommendationCollapsed(false);
    setRecommendation({
      providerId: recommendationProviderId,
      status: "loading",
    });

    const result = await callProviderOnce(recommendationProviderId, messages);
    if (result.ok) {
      setRecommendation({
        providerId: recommendationProviderId,
        status: "done",
        text: result.text,
      });
    } else {
      setRecommendation({
        providerId: recommendationProviderId,
        status: "error",
        error: result.error,
      });
    }
  }

  // Minimal duplicate of executeTurn's connect/credentials/executePrompt/error
  // boilerplate — intentionally NOT extracted into a shared helper, so
  // executeTurn and runReview remain completely untouched.
  async function callProviderOnce(
    providerId: ProviderId,
    messages: Message[],
  ): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
    try {
      const connected = await connectionManager.isConnected(providerId);
      if (!connected) {
        return {
          ok: false,
          error: "Not connected. Connect this provider first.",
        };
      }
      const credentials = await connectionManager.get(providerId);
      const provider = createProvider(providerId);
      const result = await provider!.executePrompt({
        messages,
        credentials: credentials ?? undefined,
        modelId: selectedModelIds[providerId],
      });
      return { ok: true, text: result.text };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      if (error instanceof Error && error.name === "AuthenticationError") {
        await connectionManager.clear(providerId);
      }
      return { ok: false, error: message };
    }
  }

  function getDebateParticipants(): DebateParticipant[] {
    return visibleResults
      .map((id): DebateParticipant | null => {
        const conversation = conversations[id] ?? [];
        const lastMsg = conversation[conversation.length - 1];
        if (lastMsg?.role !== "assistant") return null;
        const prevMsg = conversation[conversation.length - 2];
        const originalUserPrompt =
          prevMsg?.role === "user" ? prevMsg.content : "";
        const provider = providers.find((entry) => entry.id === id)!.provider;
        return {
          id,
          displayName: provider.displayName,
          originalUserPrompt,
          originalResponseText: lastMsg.content,
        };
      })
      .filter((p): p is DebateParticipant => p !== null);
  }

  async function runDebate() {
    const participants = getDebateParticipants();
    const validation = canStartDebate(participants);
    if (!validation.ok) return;

    const ring = computeDebateRing(participants);
    const displayNameById = new Map(
      participants.map((p) => [p.id, p.displayName]),
    );

    setDebate({
      status: "round1",
      round1: ring.map((pairing) => ({
        key: `${pairing.reviewer.id}->${pairing.reviewee.id}`,
        reviewerId: pairing.reviewer.id as ProviderId,
        revieweeId: pairing.reviewee.id as ProviderId,
        reviewerDisplayName: pairing.reviewer.displayName,
        revieweeDisplayName: pairing.reviewee.displayName,
        status: "loading",
      })),
      round2: [],
    });

    // Round 1: run all critiques concurrently; wait for ALL to settle before
    // Round 2 begins (a round-level barrier — this is the "sequential"
    // requirement: round 2 cannot start until every round 1 call is done).
    const round1Results = await Promise.all(
      ring.map((pairing) =>
        callProviderOnce(
          pairing.reviewer.id as ProviderId,
          buildDebateReviewMessages(pairing),
        ),
      ),
    );

    setDebate((prev) =>
      prev
        ? {
            ...prev,
            round1: prev.round1.map((entry, i) => {
              const r = round1Results[i];
              return r.ok
                ? { ...entry, status: "done" as const, text: r.text }
                : { ...entry, status: "error" as const, error: r.error };
            }),
          }
        : prev,
    );

    // Round 2: each original participant responds to the critique it
    // received. If that critique failed, skip this participant's round 2
    // call rather than inventing a critique to respond to.
    const round2Targets = participants.map((participant) => {
      const critiqueIndex = ring.findIndex(
        (pairing) => pairing.reviewee.id === participant.id,
      );
      const critique = round1Results[critiqueIndex];
      return {
        participant,
        critique: critique && critique.ok ? critique.text : null,
      };
    });

    setDebate((prev) =>
      prev
        ? {
            ...prev,
            status: "round2",
            round2: round2Targets.map(({ participant, critique }) => ({
              key: participant.id,
              providerId: participant.id as ProviderId,
              providerDisplayName:
                displayNameById.get(participant.id) ?? participant.id,
              status: critique === null ? "error" : "loading",
              error:
                critique === null ? "No critique received — skipping." : undefined,
            })),
          }
        : prev,
    );

    const pending = round2Targets.filter((t) => t.critique !== null);
    const round2Results = await Promise.all(
      pending.map((t) =>
        callProviderOnce(
          t.participant.id as ProviderId,
          buildRebuttalMessages(
            t.participant.originalResponseText,
            t.critique as string,
          ),
        ),
      ),
    );

    setDebate((prev) => {
      if (!prev) return prev;
      let resultIndex = 0;
      return {
        ...prev,
        status: "complete",
        round2: prev.round2.map((entry) => {
          if (entry.error === "No critique received — skipping.")
            return entry;
          const r = round2Results[resultIndex++];
          return r.ok
            ? { ...entry, status: "done" as const, text: r.text }
            : { ...entry, status: "error" as const, error: r.error };
        }),
      };
    });
  }

  const projectOperationsDisabled =
    isRunning ||
    Object.values(results).some((result) => result?.status === "loading") ||
    Object.values(reviews).some((entries) =>
      entries?.some((entry) => entry.status === "loading"),
    ) ||
    (debate !== null && debate.status !== "complete") ||
    recommendation?.status === "loading";

  async function saveActiveProject() {
    if (!activeProjectId) return;
    if (projectSaveTimeoutRef.current !== null) {
      window.clearTimeout(projectSaveTimeoutRef.current);
      projectSaveTimeoutRef.current = null;
    }
    const updated = await projectRepository.save(
      activeProjectId,
      buildProjectSnapshot(),
    );
    if (!updated) return;
    setProjects((current) =>
      current.map((project) =>
        project.id === updated.id ? updated : project,
      ),
    );
  }

  async function handleCreateProject(name: string) {
    if (projectOperationsDisabled) return;
    await saveActiveProject();
    const stored = await projectRepository.create(name);
    await projectRepository.setActive(stored.project.id);

    skipNextProjectSaveRef.current = true;
    setProjects((current) => [...current, stored.project]);
    setActiveProjectId(stored.project.id);
    applyProjectSnapshot({
      ...stored.workspace,
      selectedModelIds: {
        ...settings.defaultModelIds,
        ...stored.workspace.selectedModelIds,
      },
      recommendationProviderId: (WORKSPACE_PROVIDER_IDS.includes(
        settings.defaultProviderId as ProviderId,
      )
        ? settings.defaultProviderId
        : stored.workspace.recommendationProviderId) as ProviderId,
    });
  }

  async function handleSelectProject(projectId: string) {
    if (
      projectOperationsDisabled ||
      !projectId ||
      projectId === activeProjectId
    ) {
      return;
    }

    await saveActiveProject();
    const workspace = await projectRepository.get(projectId);
    if (!workspace) return;
    await projectRepository.setActive(projectId);

    skipNextProjectSaveRef.current = true;
    setActiveProjectId(projectId);
    applyProjectSnapshot(workspace);
  }

  // Consumes a pending Global Search selection: switches to the matched
  // project if needed, then scrolls to and briefly highlights the matched
  // section. Kept behind a ref so the mount-once event listener always calls
  // the latest closure.
  async function runSearchNavigation() {
    const target = consumeSearchNavigation();
    if (!target) return;

    if (target.projectId !== activeProjectId) {
      await handleSelectProject(target.projectId);
    }
    if (!target.anchor) return;

    if (searchHighlightTimeoutRef.current !== null) {
      window.clearTimeout(searchHighlightTimeoutRef.current);
    }
    setSearchHighlightAnchor(target.anchor);
    // Give React a beat to render the switched project before scrolling.
    window.setTimeout(() => {
      document
        .getElementById(`search-anchor-${target.anchor}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    searchHighlightTimeoutRef.current = window.setTimeout(() => {
      setSearchHighlightAnchor(null);
      searchHighlightTimeoutRef.current = null;
    }, 2400);
  }

  useEffect(() => {
    searchNavigationRef.current = () => {
      void runSearchNavigation();
    };
  });

  useEffect(() => {
    createProjectRef.current = (name: string) => {
      void handleCreateProject(name);
    };
  });

  useEffect(() => {
    if (!projectsHydrated) return;
    // Arriving from another page: the handoff is already in sessionStorage.
    searchNavigationRef.current();
    // Already mounted on /workspace: the modal notifies via this event.
    const listener = () => searchNavigationRef.current();
    window.addEventListener(SEARCH_NAVIGATE_EVENT, listener);
    return () => window.removeEventListener(SEARCH_NAVIGATE_EVENT, listener);
  }, [projectsHydrated]);

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable
      );
    }

    function handleShortcut(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return;

      if (event.key === "?") {
        event.preventDefault();
        router.push("/settings#keyboard");
        return;
      }

      if (event.key === "e" || event.key === "E") {
        if (event.metaKey || event.ctrlKey || event.altKey) return;
        event.preventDefault();
        setExportOpen(true);
        return;
      }

      if (event.key === "N" && event.shiftKey) {
        event.preventDefault();
        const name = window.prompt("Project name");
        if (name?.trim()) createProjectRef.current(name.trim());
        return;
      }

      if (event.key === "n" && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        setConversations({});
        setResults({});
        setHasRun(false);
        setReviews({});
        setDebate(null);
        setRecommendation(null);
        setUserPrompt("");
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [projectsHydrated, router]);

  async function handleRenameProject(projectId: string, name: string) {
    if (projectOperationsDisabled || !name.trim()) return;
    const updated = await projectRepository.rename(projectId, name);
    if (!updated) return;
    setProjects((current) =>
      current.map((project) =>
        project.id === updated.id ? updated : project,
      ),
    );
  }

  async function handleDeleteProject(projectId: string) {
    if (projectOperationsDisabled) return;
    const project = projects.find((entry) => entry.id === projectId);
    if (!project) return;
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) {
      return;
    }

    if (projectId !== activeProjectId) {
      await projectRepository.delete(projectId);
      setProjects((current) =>
        current.filter((entry) => entry.id !== projectId),
      );
      return;
    }

    const remaining = projects.filter((entry) => entry.id !== projectId);
    await projectRepository.delete(projectId);

    if (remaining.length > 0) {
      const nextProject = remaining[0];
      const workspace =
        (await projectRepository.get(nextProject.id)) ??
        emptyProjectWorkspace();
      await projectRepository.setActive(nextProject.id);
      skipNextProjectSaveRef.current = true;
      setProjects(remaining);
      setActiveProjectId(nextProject.id);
      applyProjectSnapshot(workspace);
      return;
    }

    const stored = await projectRepository.create("My Project");
    await projectRepository.setActive(stored.project.id);
    skipNextProjectSaveRef.current = true;
    setProjects([stored.project]);
    setActiveProjectId(stored.project.id);
    applyProjectSnapshot(stored.workspace);
  }

  function startNewConversation(id: ProviderId) {
    // Clears only this provider's thread — no other provider's state,
    // connection, or credentials are touched.
    setConversations((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setReviews((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

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

  const anyLoading = Object.values(results).some(
    (result) => result?.status === "loading",
  );
  const canRun =
    userPrompt.trim() !== "" && selectedIds.size > 0 && !isRunning && !anyLoading;

  // The single execution primitive behind Run, Regenerate, and Edit & Resend.
  // Sends `[...baseConversation, userContent]` to this provider (system
  // prompt read fresh from the field, never stored in history) and commits
  // `baseConversation + user + assistant` on success. Failures commit
  // nothing beyond `baseConversation`, so history is never poisoned.
  async function executeTurn(
    id: ProviderId,
    baseConversation: Message[],
    userContent: string,
  ) {
    const controller = new AbortController();
    abortControllersRef.current[id]?.abort();
    abortControllersRef.current[id] = controller;
    let streamedText = "";

    setResults((prev) => ({
      ...prev,
      [id]: {
        status: "loading",
        pendingUser: userContent,
        streamedText: "",
      },
    }));

    try {
      const connected = await connectionManager.isConnected(id);
      if (controller.signal.aborted) {
        if (abortControllersRef.current[id] === controller) {
          setResults((prev) => ({
            ...prev,
            [id]: { status: "error", error: "Generation stopped." },
          }));
        }
        return;
      }
      if (!connected) {
        if (abortControllersRef.current[id] === controller) {
          setResults((prev) => ({
            ...prev,
            [id]: {
              status: "error",
              error: "Not connected. Connect this provider first.",
            },
          }));
        }
        return;
      }

      const credentials = await connectionManager.get(id);
      const provider = createProvider(id);
      const result = await provider!.executePrompt({
        messages: [
          ...(systemPrompt
            ? [{ role: "system" as const, content: systemPrompt }]
            : []),
          ...baseConversation,
          { role: "user" as const, content: userContent },
        ],
        credentials: credentials ?? undefined,
        modelId: selectedModelIds[id],
        signal: controller.signal,
        onChunk: (chunk) => {
          if (abortControllersRef.current[id] !== controller) return;
          streamedText += chunk;
          setResults((prev) => ({
            ...prev,
            [id]: {
              status: "loading",
              pendingUser: userContent,
              streamedText,
            },
          }));
          if (settings.autoScrollWhileStreaming) {
            document
              .getElementById(`search-anchor-response-${id}`)
              ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }
        },
      });
      if (abortControllersRef.current[id] !== controller) return;
      setConversations((prev) => ({
        ...prev,
        [id]: [
          ...baseConversation,
          { role: "user", content: userContent },
          { role: "assistant", content: result.text },
        ],
      }));
      setResults((prev) => ({
        ...prev,
        [id]: { status: "done", usage: result.usage },
      }));
    } catch (error) {
      if (abortControllersRef.current[id] !== controller) return;
      if (controller.signal.aborted) {
        if (streamedText) {
          setConversations((prev) => ({
            ...prev,
            [id]: [
              ...baseConversation,
              { role: "user", content: userContent },
              { role: "assistant", content: streamedText },
            ],
          }));
          setResults((prev) => ({
            ...prev,
            [id]: { status: "done", stopped: true },
          }));
        } else {
          setResults((prev) => ({
            ...prev,
            [id]: { status: "error", error: "Generation stopped." },
          }));
        }
        return;
      }

      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      if (error instanceof Error && error.name === "AuthenticationError") {
        await connectionManager.clear(id);
      }
      setResults((prev) => ({
        ...prev,
        [id]: { status: "error", error: message },
      }));
    } finally {
      if (abortControllersRef.current[id] === controller) {
        delete abortControllersRef.current[id];
      }
    }
  }

  function stopGeneration(id: ProviderId) {
    abortControllersRef.current[id]?.abort();
  }

  async function handleRun() {
    if (!canRun) return;

    const selected = WORKSPACE_PROVIDER_IDS.filter((id) => selectedIds.has(id));

    setHasRun(true);
    setIsRunning(true);
    await Promise.allSettled(
      selected.map((id) => executeTurn(id, conversations[id] ?? [], userPrompt)),
    );
    setIsRunning(false);
  }

  // Regenerate: drop the latest assistant reply and rerun the latest user
  // message against the history before it. Only this provider is affected.
  async function handleRegenerate(id: ProviderId) {
    const conversation = conversations[id] ?? [];
    const last = conversation[conversation.length - 1];
    const previous = conversation[conversation.length - 2];
    if (last?.role !== "assistant" || previous?.role !== "user") return;
    if (results[id]?.status === "loading") return;

    const base = conversation.slice(0, -2);
    setConversations((prev) => ({ ...prev, [id]: base }));
    setReviews((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    await executeTurn(id, base, previous.content);
  }

  // Edit & Resend: replace the latest user message, drop its assistant
  // reply, and rerun. Older turns are untouched by construction.
  async function handleEditResend(id: ProviderId, newContent: string) {
    if (newContent.trim() === "") return;
    const conversation = conversations[id] ?? [];
    const last = conversation[conversation.length - 1];
    const previous = conversation[conversation.length - 2];
    if (last?.role !== "assistant" || previous?.role !== "user") return;
    if (results[id]?.status === "loading") return;

    setEditing(null);
    const base = conversation.slice(0, -2);
    setConversations((prev) => ({ ...prev, [id]: base }));
    setReviews((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    await executeTurn(id, base, newContent);
  }

  // Fills the two controlled prompt fields for review/editing only — never
  // executes anything on its own.
  function handleSelectPrompt(prompt: LibraryPrompt) {
    setSystemPrompt(prompt.systemPrompt);
    setUserPrompt(prompt.userPrompt);
  }

  function handlePromptKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void handleRun();
    }
  }

  const visibleResults = hasRun
    ? WORKSPACE_PROVIDER_IDS.filter((id) => selectedIds.has(id))
    : [];

  const exportSource: ExportSource | null = (() => {
    const project = projects.find((entry) => entry.id === activeProjectId);
    if (!project) return null;
    return {
      project,
      workspace: buildProjectSnapshot(),
      providerName: (id) =>
        providers.find((entry) => entry.id === id)?.provider.displayName ?? id,
    };
  })();

  if (!projectsHydrated) {
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
      </main>
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
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <ProjectsSidebar
            projects={projects}
            activeProjectId={activeProjectId}
            disabled={projectOperationsDisabled}
            onCreate={(name) => {
              void handleCreateProject(name);
            }}
            onRename={(projectId, name) => {
              void handleRenameProject(projectId, name);
            }}
            onDelete={(projectId) => {
              void handleDeleteProject(projectId);
            }}
            onSelect={(projectId) => {
              void handleSelectProject(projectId);
            }}
          />
          <div className="min-w-0 flex-1">
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
                const models = availableModels[id] ?? [];
                const selectedModel =
                  selectedModelIds[id] ?? provider.defaultModelId ?? "";
                const modelOptions =
                  selectedModel &&
                  !models.some((model) => model.id === selectedModel)
                    ? [
                        { id: selectedModel, name: selectedModel },
                        ...models,
                      ]
                    : models;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 rounded-lg"
                    style={{
                      background: "var(--color-glass)",
                      border: "1px solid var(--color-border)",
                      padding: "10px 14px",
                    }}
                  >
                    <label
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
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
                          background: checked
                            ? "var(--color-accent)"
                            : "transparent",
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
                    <select
                      aria-label={`${provider.displayName} model`}
                      value={selectedModel}
                      disabled={
                        modelsLoadingIds.has(id) ||
                        results[id]?.status === "loading"
                      }
                      title={modelErrors[id]}
                      onChange={(event) =>
                        setSelectedModelIds((current) => ({
                          ...current,
                          [id]: event.target.value,
                        }))
                      }
                      style={{
                        maxWidth: 220,
                        minWidth: 0,
                        background: "var(--color-bg)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text)",
                        borderRadius: 8,
                        padding: "5px 8px",
                        fontFamily: "var(--font-body)",
                        fontSize: "0.75rem",
                      }}
                    >
                      {modelsLoadingIds.has(id) && modelOptions.length === 0 ? (
                        <option value="">Loading models...</option>
                      ) : (
                        modelOptions.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            <PromptLibraryPanel onSelect={handleSelectPrompt} />
          </div>

          <label className="mt-6 flex flex-col gap-2">
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
              onKeyDown={handlePromptKeyDown}
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
              onKeyDown={handlePromptKeyDown}
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

          <div className="mt-8 flex items-center gap-3">
            <button
              type="button"
              onClick={handleRun}
              disabled={!canRun}
              className="flex-1 rounded-full font-semibold"
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
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              disabled={!projectsHydrated || !activeProjectId}
              className="rounded-full font-semibold"
              style={{
                background: "transparent",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
                padding: "10px 20px",
                fontFamily: "var(--font-body)",
                fontSize: "0.9rem",
                cursor:
                  !projectsHydrated || !activeProjectId
                    ? "not-allowed"
                    : "pointer",
                opacity: !projectsHydrated || !activeProjectId ? 0.6 : 1,
                flexShrink: 0,
              }}
            >
              Export
            </button>
          </div>
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
            {(() => {
              const consensusResponses: ConsensusResponse[] = visibleResults
                .map((id): ConsensusResponse | null => {
                  const text = lastAssistantText(conversations[id] ?? []);
                  if (!text) return null;
                  const provider = providers.find((entry) => entry.id === id)!.provider;
                  return {
                    id: id as string,
                    displayName: provider.displayName,
                    text,
                  };
                })
                .filter((entry): entry is ConsensusResponse => entry !== null);

              if (consensusResponses.length < 2) return null;

              const consensus = computeConsensusV2(consensusResponses);
              return <ConsensusCard result={consensus} />;
            })()}
            {(() => {
              const comparisonEntries: ComparisonEntry[] = visibleResults
                .map((id): ComparisonEntry | null => {
                  const text = lastAssistantText(conversations[id] ?? []);
                  if (!text) return null;
                  const provider = providers.find((entry) => entry.id === id)!.provider;
                  return {
                    id: id as string,
                    displayName: provider.displayName,
                    stats: computeResponseStats(text),
                  };
                })
                .filter((entry): entry is ComparisonEntry => entry !== null);

              const summaryLines = buildComparisonSummary(comparisonEntries);

              return settings.showResponseStatistics && summaryLines.length > 0 ? (
                <div
                  className="rounded-lg"
                  style={{
                    background: "var(--color-glass)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    marginBottom: 16,
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: "var(--color-text)",
                    }}
                  >
                    {summaryLines[0]}
                  </p>
                  {summaryLines.slice(1).map((line, index) => (
                    <p
                      key={index}
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.8rem",
                        color: "var(--color-muted)",
                        marginTop: 4,
                      }}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              ) : null;
            })()}
            <div className="flex flex-col gap-4">
              {visibleResults.map((id) => {
                const provider = providers.find((entry) => entry.id === id)!.provider;
                const result = results[id];
                const conversation = conversations[id] ?? [];
                const latestResponse = lastAssistantText(conversation);
                const stats = latestResponse
                  ? computeResponseStats(latestResponse)
                  : null;
                const isSearchHighlighted =
                  searchHighlightAnchor === `response-${id}`;
                const cardPadding = settings.compactMode ? "10px 12px" : "16px 18px";
                return (
                  <div
                    key={id}
                    id={`search-anchor-response-${id}`}
                    className="rounded-lg"
                    style={{
                      background: "var(--color-glass)",
                      border: isSearchHighlighted
                        ? "1px solid var(--color-accent)"
                        : "1px solid var(--color-border)",
                      boxShadow: isSearchHighlighted
                        ? "0 0 0 3px rgba(238,123,48,0.3)"
                        : "none",
                      transition:
                        "border-color 0.3s ease, box-shadow 0.3s ease",
                      padding: cardPadding,
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
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
                      {result?.status === "loading" ? (
                        <button
                          type="button"
                          onClick={() => stopGeneration(id)}
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "0.75rem",
                            color: "var(--color-text)",
                            background: "var(--color-glass)",
                            border: "1px solid var(--color-border)",
                            borderRadius: 999,
                            padding: "4px 10px",
                            cursor: "pointer",
                            flexShrink: 0,
                          }}
                        >
                          Stop generation
                        </button>
                      ) : latestResponse !== null ? (
                        <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => handleRegenerate(id)}
                            style={{
                              fontFamily: "var(--font-body)",
                              fontSize: "0.75rem",
                              color: "var(--color-text)",
                              background: "var(--color-glass)",
                              border: "1px solid var(--color-border)",
                              borderRadius: 999,
                              padding: "4px 10px",
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                          >
                            Regenerate
                          </button>
                          <button
                            type="button"
                            onClick={() => startNewConversation(id)}
                            style={{
                              fontFamily: "var(--font-body)",
                              fontSize: "0.75rem",
                              color: "var(--color-text)",
                              background: "var(--color-glass)",
                              border: "1px solid var(--color-border)",
                              borderRadius: 999,
                              padding: "4px 10px",
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                          >
                            New Conversation
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyResponse(id, latestResponse)}
                            style={{
                              fontFamily: "var(--font-body)",
                              fontSize: "0.75rem",
                              color: "var(--color-text)",
                              background: "var(--color-glass)",
                              border: "1px solid var(--color-border)",
                              borderRadius: 999,
                              padding: "4px 10px",
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                          >
                            {copiedId === id ? "Copied" : "Copy Response"}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleCollapsed(id)}
                            style={{
                              fontFamily: "var(--font-body)",
                              fontSize: "0.75rem",
                              color: "var(--color-text)",
                              background: "var(--color-glass)",
                              border: "1px solid var(--color-border)",
                              borderRadius: 999,
                              padding: "4px 10px",
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                          >
                            {collapsedIds.has(id) ? "Expand" : "Collapse"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setReviewDialogFor(
                                reviewDialogFor === id ? null : id,
                              )
                            }
                            style={{
                              fontFamily: "var(--font-body)",
                              fontSize: "0.75rem",
                              color: "var(--color-text)",
                              background: "var(--color-glass)",
                              border: "1px solid var(--color-border)",
                              borderRadius: 999,
                              padding: "4px 10px",
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                          >
                            Review
                          </button>
                        </div>
                      ) : null}
                    </div>
                    {reviewDialogFor === id && (
                      <ReviewDialog
                        reviewerOptions={providers
                          .filter((entry) => entry.id !== id)
                          .map((entry) => ({
                            id: entry.id,
                            displayName: entry.provider.displayName,
                          }))}
                        onSubmit={(reviewerId, focus) =>
                          runReview(id, reviewerId, focus)
                        }
                        onCancel={() => setReviewDialogFor(null)}
                      />
                    )}
                    {settings.showResponseStatistics && stats && (
                      <p
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.75rem",
                          color: "var(--color-muted)",
                          marginTop: 4,
                        }}
                      >
                        {[
                          `${stats.wordCount.toLocaleString()} ${stats.wordCount === 1 ? "word" : "words"}`,
                          stats.readingTimeLabel,
                          `${stats.characterCount.toLocaleString()} ${stats.characterCount === 1 ? "character" : "characters"}`,
                          formatTokenUsage(result?.usage),
                          result?.stopped ? "Stopped" : null,
                          stats.codeBlockCount > 0
                            ? `${stats.codeBlockCount} ${stats.codeBlockCount === 1 ? "code block" : "code blocks"}`
                            : null,
                          stats.tableCount > 0
                            ? `${stats.tableCount} ${stats.tableCount === 1 ? "table" : "tables"}`
                            : null,
                          stats.listCount > 0
                            ? `${stats.listCount} ${stats.listCount === 1 ? "list" : "lists"}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    )}
                    <div style={{ marginTop: 10 }}>
                      {(conversation.length > 0 ||
                        result?.status === "loading") && (
                        <AnimatePresence initial={false}>
                          {!collapsedIds.has(id) && (
                            <motion.div
                              key="body"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                              style={{ overflow: "hidden" }}
                            >
                              <div className="flex flex-col gap-3">
                                {conversation.map((message, index) => {
                                  if (message.role !== "user") {
                                    return (
                                      <MarkdownResponse
                                        key={index}
                                        text={message.content}
                                      />
                                    );
                                  }
                                  // Only the latest user message (the one
                                  // whose assistant reply ends the thread)
                                  // is editable.
                                  const isLatestUser =
                                    index === conversation.length - 2 &&
                                    conversation[conversation.length - 1]
                                      ?.role === "assistant";
                                  const isEditing =
                                    editing?.id === id && isLatestUser;
                                  if (isEditing) {
                                    return (
                                      <div key={index} className="flex flex-col gap-2">
                                        <textarea
                                          value={editing.text}
                                          onChange={(event) =>
                                            setEditing({
                                              id,
                                              text: event.target.value,
                                            })
                                          }
                                          rows={3}
                                          className="w-full rounded-lg"
                                          style={{
                                            background: "var(--color-glass)",
                                            border: "1px solid var(--color-border)",
                                            color: "var(--color-text)",
                                            padding: "8px 12px",
                                            fontFamily: "var(--font-body)",
                                            fontSize: "0.85rem",
                                            resize: "vertical",
                                          }}
                                        />
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleEditResend(id, editing.text)
                                            }
                                            style={{
                                              fontFamily: "var(--font-body)",
                                              fontSize: "0.75rem",
                                              color: "var(--color-text)",
                                              background: "var(--color-glass)",
                                              border: "1px solid var(--color-border)",
                                              borderRadius: 999,
                                              padding: "4px 10px",
                                              cursor: "pointer",
                                            }}
                                          >
                                            Resend
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditing(null)}
                                            style={{
                                              fontFamily: "var(--font-body)",
                                              fontSize: "0.75rem",
                                              color: "var(--color-muted)",
                                              background: "var(--color-glass)",
                                              border: "1px solid var(--color-border)",
                                              borderRadius: 999,
                                              padding: "4px 10px",
                                              cursor: "pointer",
                                            }}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return (
                                    <div key={index} className="flex flex-col gap-1">
                                      <p
                                        className="rounded-lg"
                                        style={{
                                          fontFamily: "var(--font-body)",
                                          fontSize: "0.85rem",
                                          color: "var(--color-text)",
                                          background: "var(--color-glass)",
                                          border: "1px solid var(--color-border)",
                                          padding: "8px 12px",
                                          whiteSpace: "pre-wrap",
                                        }}
                                      >
                                        {message.content}
                                      </p>
                                      {isLatestUser &&
                                        result?.status !== "loading" && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setEditing({
                                                id,
                                                text: message.content,
                                              })
                                            }
                                            className="self-start"
                                            style={{
                                              fontFamily: "var(--font-body)",
                                              fontSize: "0.72rem",
                                              color: "var(--color-muted)",
                                              background: "transparent",
                                              border: "none",
                                              padding: 0,
                                              cursor: "pointer",
                                            }}
                                          >
                                            Edit
                                          </button>
                                        )}
                                    </div>
                                  );
                                })}
                                {result?.status === "loading" && (
                                  <>
                                    {result.pendingUser && (
                                      <p
                                        className="rounded-lg"
                                        style={{
                                          fontFamily: "var(--font-body)",
                                          fontSize: "0.85rem",
                                          color: "var(--color-text)",
                                          background: "var(--color-glass)",
                                          border: "1px solid var(--color-border)",
                                          padding: "8px 12px",
                                          whiteSpace: "pre-wrap",
                                        }}
                                      >
                                        {result.pendingUser}
                                      </p>
                                    )}
                                    {result.streamedText ? (
                                      <div aria-live="polite">
                                        <MarkdownResponse
                                          text={result.streamedText}
                                        />
                                      </div>
                                    ) : (
                                      <p
                                        className="rounded-lg self-start"
                                        style={{
                                          fontFamily: "var(--font-body)",
                                          fontSize: "0.85rem",
                                          color: "var(--color-muted)",
                                          background: "var(--color-glass)",
                                          border:
                                            "1px solid var(--color-border)",
                                          padding: "8px 12px",
                                        }}
                                      >
                                        Thinking...
                                      </p>
                                    )}
                                  </>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                      {result?.status === "error" && (
                        <p
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "0.85rem",
                            color: "var(--color-muted)",
                            marginTop: conversation.length > 0 ? 10 : 0,
                          }}
                        >
                          {result.error}
                        </p>
                      )}
                      {(() => {
                        const providerReviews = reviews[id] ?? [];
                        const latestReview =
                          providerReviews[providerReviews.length - 1] ?? null;
                        return latestReview ? (
                          <ReviewResult
                            reviewerDisplayName={
                              providers.find(
                                (entry) => entry.id === latestReview.reviewerId,
                              )!.provider.displayName
                            }
                            focusLabel={reviewFocusLabel(latestReview.focus)}
                            status={latestReview.status}
                            text={latestReview.text}
                            error={latestReview.error}
                            collapsed={reviewCollapsedIds.has(id)}
                            onToggleCollapse={() => toggleReviewCollapsed(id)}
                            onCopy={() =>
                              handleCopyReview(id, latestReview.text ?? "")
                            }
                            copied={reviewCopiedId === id}
                          />
                        ) : null;
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
            {(() => {
              const participants = getDebateParticipants();
              const validation = canStartDebate(participants);
              const anyReviewOrResultLoading = Object.values(results).some(
                (r) => r?.status === "loading",
              );
              return (
                <div
                  id="search-anchor-debate"
                  className="rounded-lg"
                  style={{
                    marginTop: 16,
                    boxShadow:
                      searchHighlightAnchor === "debate"
                        ? "0 0 0 3px rgba(238,123,48,0.3)"
                        : "none",
                    transition: "box-shadow 0.3s ease",
                  }}
                >
                  {!debate && (
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          void runDebate();
                        }}
                        disabled={!validation.ok || anyReviewOrResultLoading}
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.85rem",
                          color: "var(--color-text)",
                          background: "var(--color-glass)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 999,
                          padding: "8px 16px",
                          cursor:
                            validation.ok && !anyReviewOrResultLoading
                              ? "pointer"
                              : "not-allowed",
                          opacity:
                            validation.ok && !anyReviewOrResultLoading ? 1 : 0.6,
                          alignSelf: "flex-start",
                        }}
                      >
                        Start Debate
                      </button>
                      {!validation.ok && (
                        <p
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "0.75rem",
                            color: "var(--color-muted)",
                          }}
                        >
                          {validation.reason}
                        </p>
                      )}
                    </div>
                  )}
                  {debate && (
                    <DebatePanel
                      overallStatus={debate.status}
                      round1={debate.round1.map(
                        (e): DebateRound1EntryView => ({
                          key: e.key,
                          reviewerDisplayName: e.reviewerDisplayName,
                          revieweeDisplayName: e.revieweeDisplayName,
                          status: e.status,
                          text: e.text,
                          error: e.error,
                        }),
                      )}
                      round2={debate.round2.map(
                        (e): DebateRound2EntryView => ({
                          key: e.key,
                          providerDisplayName: e.providerDisplayName,
                          status: e.status,
                          text: e.text,
                          error: e.error,
                        }),
                      )}
                      collapsedKeys={debateCollapsedKeys}
                      onToggleCollapse={toggleDebateCollapsed}
                      copiedKey={debateCopiedKey}
                      onCopy={handleCopyDebateEntry}
                    />
                  )}
                </div>
              );
            })()}
            {(() => {
              const completedCount = visibleResults.filter((id) => {
                const text = lastAssistantText(conversations[id] ?? []);
                return text !== null;
              }).length;
              const validation = canGenerateRecommendation(completedCount);
              const anyResultLoading = Object.values(results).some(
                (r) => r?.status === "loading",
              );
              const canGenerate =
                validation.ok &&
                !anyResultLoading &&
                recommendation?.status !== "loading";

              return (
                <div
                  id="search-anchor-recommendation"
                  className="rounded-lg"
                  style={{
                    boxShadow:
                      searchHighlightAnchor === "recommendation"
                        ? "0 0 0 3px rgba(238,123,48,0.3)"
                        : "none",
                    transition: "box-shadow 0.3s ease",
                  }}
                >
                <RecommendationPanel
                  providerOptions={providers.map((entry) => ({
                    id: entry.id,
                    displayName: entry.provider.displayName,
                  }))}
                  selectedProviderId={recommendationProviderId}
                  onSelectProvider={setRecommendationProviderId}
                  canGenerate={canGenerate}
                  disabledReason={
                    !validation.ok
                      ? validation.reason
                      : anyResultLoading
                        ? "Wait for provider responses to finish before generating a recommendation."
                        : undefined
                  }
                  recommendation={recommendation}
                  onGenerate={() => {
                    void runRecommendation();
                  }}
                  collapsed={recommendationCollapsed}
                  onToggleCollapse={() =>
                    setRecommendationCollapsed((prev) => !prev)
                  }
                  copied={recommendationCopied}
                  onCopy={() =>
                    handleCopyRecommendation(recommendation?.text ?? "")
                  }
                />
                </div>
              );
            })()}
          </motion.div>
        )}
          </div>
        </div>
      </div>

      {exportOpen && exportSource && (
        <ExportDialog
          source={exportSource}
          onClose={() => setExportOpen(false)}
        />
      )}
    </main>
  );
}
