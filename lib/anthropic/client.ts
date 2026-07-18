import type Anthropic from "@anthropic-ai/sdk";
import type {
  Message,
  ProviderExecutionResult,
} from "@/lib/providers/Provider";
import type { AnthropicModelSummary } from "./types";
import { normalizeAnthropicError } from "./errors";

async function createSdkClient(apiKey: string): Promise<Anthropic> {
  const { default: AnthropicClient } = await import("@anthropic-ai/sdk");
  return new AnthropicClient({ apiKey, dangerouslyAllowBrowser: true });
}

// Used for BOTH validation (connect() calls this and discards the result —
// if it doesn't throw, the key is valid) AND real model retrieval
// (getModels() calls this and returns the result). No caching anywhere in
// this file — every call hits the network.
export async function listModels(apiKey: string): Promise<AnthropicModelSummary[]> {
  try {
    const client = await createSdkClient(apiKey);
    const response = await client.models.list();
    const models = response.data.map((model) => ({
      id: model.id,
      displayName: model.display_name,
    }));
    models.sort((a, b) => a.displayName.localeCompare(b.displayName));
    return models;
  } catch (error) {
    throw normalizeAnthropicError(error);
  }
}

// Used by ClaudeProvider.executePrompt() for real prompt execution against
// the Messages API. Request-scoped like listModels() above — no caching, no
// stored state.
//
// Model: "claude-haiku-4-5" — the current fast/cheap Claude model. (Not
// "claude-3-5-haiku-latest": that alias isn't in the installed
// @anthropic-ai/sdk's `Model` union and targets a retired model family.)
// The Messages API keeps `system` as a top-level param and rejects
// system-role entries inside `messages[]`, so generic system messages are
// hoisted out here — this file owns that format divergence, not callers.
export async function generateCompletion(
  apiKey: string,
  messages: Message[],
  options?: {
    modelId?: string;
    signal?: AbortSignal;
    onChunk?: (chunk: string) => void;
  },
): Promise<ProviderExecutionResult> {
  try {
    const system = messages
      .filter((message) => message.role === "system")
      .map((message) => message.content)
      .join("\n\n");
    const turns = messages
      .filter(
        (message): message is Message & { role: "user" | "assistant" } =>
          message.role === "user" || message.role === "assistant",
      )
      .map((message) => ({ role: message.role, content: message.content }));

    const client = await createSdkClient(apiKey);
    let text = "";
    const stream = client.messages
      .stream(
        {
          model: options?.modelId ?? "claude-haiku-4-5",
          max_tokens: 1024,
          ...(system ? { system } : {}),
          messages: turns,
        },
        { signal: options?.signal },
      )
      .on("text", (chunk) => {
        text += chunk;
        options?.onChunk?.(chunk);
      });
    const response = await stream.finalMessage();
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;

    return {
      text,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
    };
  } catch (error) {
    if (
      options?.signal?.aborted ||
      (error instanceof Error && error.name === "AbortError")
    ) {
      throw error;
    }
    throw normalizeAnthropicError(error);
  }
}
