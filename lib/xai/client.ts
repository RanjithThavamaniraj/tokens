import type {
  Message,
  ProviderExecutionResult,
} from "@/lib/providers/Provider";
import {
  listOpenAICompatibleModels,
  streamOpenAICompatibleCompletion,
} from "@/lib/openai-compatible/client";
import { normalizeXAIError } from "./errors";
import type { XAIModelSummary } from "./types";

const XAI_BASE_URL = "https://api.x.ai/v1";

export async function listModels(apiKey: string): Promise<XAIModelSummary[]> {
  const models = await listOpenAICompatibleModels({
    apiKey,
    baseURL: XAI_BASE_URL,
    normalizeError: normalizeXAIError,
  });

  return models
    .filter(
      (model) =>
        model.id.startsWith("grok-") &&
        !/(image|video|vision|audio|voice)/i.test(model.id),
    )
    .sort((a, b) => {
      const preferred = ["grok-4.5", "grok-4.3", "grok-4"];
      const aIndex = preferred.indexOf(a.id);
      const bIndex = preferred.indexOf(b.id);
      if (aIndex !== -1 || bIndex !== -1) {
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      }
      return a.id.localeCompare(b.id);
    });
}

export async function generateCompletion(
  apiKey: string,
  messages: Message[],
  options?: {
    modelId?: string;
    signal?: AbortSignal;
    onChunk?: (chunk: string) => void;
  },
): Promise<ProviderExecutionResult> {
  return streamOpenAICompatibleCompletion({
    apiKey,
    baseURL: XAI_BASE_URL,
    messages,
    model: options?.modelId ?? "grok-4.5",
    signal: options?.signal,
    onChunk: options?.onChunk,
    normalizeError: normalizeXAIError,
  });
}
