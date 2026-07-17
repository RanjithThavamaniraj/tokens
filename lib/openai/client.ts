import type {
  Message,
  ProviderExecutionResult,
} from "@/lib/providers/Provider";
import {
  listOpenAICompatibleModels,
  streamOpenAICompatibleCompletion,
} from "@/lib/openai-compatible/client";
import type { OpenAIModelSummary } from "./types";
import { normalizeOpenAIError } from "./errors";

// Used for BOTH validation (connect() calls this and discards the result —
// if it doesn't throw, the key is valid) AND real model retrieval
// (getModels() calls this and returns the result). No caching anywhere in
// this file — every call hits the network.
export async function listModels(apiKey: string): Promise<OpenAIModelSummary[]> {
  const models = await listOpenAICompatibleModels({
    apiKey,
    normalizeError: normalizeOpenAIError,
  });
  return models.filter(
    (model) =>
      /^(gpt-|chatgpt-|o[1-9](?:-|$))/i.test(model.id) &&
      !/(audio|embedding|image|moderation|realtime|transcribe|tts)/i.test(
        model.id,
      ),
  );
}

// Used by OpenAIProvider.executePrompt() for real prompt execution against
// the Chat Completions API. Request-scoped like listModels() above — no
// caching, no stored state.
//
// The generic Message roles map 1:1 onto Chat Completions roles, so no
// translation beyond the mapping below is needed.
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
    messages,
    model: options?.modelId ?? "gpt-4o-mini",
    signal: options?.signal,
    onChunk: options?.onChunk,
    normalizeError: normalizeOpenAIError,
  });
}
