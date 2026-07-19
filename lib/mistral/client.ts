import type {
  Message,
  ProviderExecutionResult,
} from "@/lib/providers/Provider";
import {
  listOpenAICompatibleModels,
  streamOpenAICompatibleCompletion,
} from "@/lib/openai-compatible/client";
import { normalizeMistralError } from "./errors";
import type { MistralModelSummary } from "./types";

const MISTRAL_BASE_URL = "https://api.mistral.ai/v1";

export async function listModels(apiKey: string): Promise<MistralModelSummary[]> {
  const models = await listOpenAICompatibleModels({
    apiKey,
    baseURL: MISTRAL_BASE_URL,
    normalizeError: normalizeMistralError,
  });

  return models
    .filter(
      (model) =>
        model.id.startsWith("mistral-") &&
        !/(image|video|vision|audio|voice)/i.test(model.id),
    )
    .sort((a, b) => {
      const preferred = ["mistral-large-latest", "mistral-large-2411", "mistral-medium-latest"];
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
    baseURL: MISTRAL_BASE_URL,
    messages,
    model: options?.modelId ?? "mistral-large-latest",
    signal: options?.signal,
    onChunk: options?.onChunk,
    normalizeError: normalizeMistralError,
  });
}
