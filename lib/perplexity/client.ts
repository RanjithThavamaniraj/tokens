import type {
  Message,
  ProviderExecutionResult,
  ProviderTokenUsage,
} from "@/lib/providers/Provider";
import {
  createPerplexityHttpError,
  normalizePerplexityError,
  PerplexityClientError,
} from "./errors";
import type {
  PerplexityAgentResponse,
  PerplexityErrorResponse,
  PerplexityModelsResponse,
  PerplexityStreamEvent,
  PerplexityUsage,
} from "./types";

const PERPLEXITY_BASE_URL = "https://api.perplexity.ai";
const DEFAULT_MODEL = "perplexity/sonar";

function headers(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

async function readErrorResponse(response: Response): Promise<PerplexityErrorResponse> {
  try {
    return (await response.json()) as PerplexityErrorResponse;
  } catch {
    return {};
  }
}

async function assertSuccessful(response: Response): Promise<void> {
  if (response.ok) return;
  throw createPerplexityHttpError(
    response.status,
    await readErrorResponse(response),
  );
}

function toUsage(usage?: PerplexityUsage): ProviderTokenUsage | undefined {
  if (!usage) return undefined;
  return {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    totalTokens:
      usage.total_tokens ??
      (usage.input_tokens !== undefined && usage.output_tokens !== undefined
        ? usage.input_tokens + usage.output_tokens
        : undefined),
  };
}

function terminalError(response?: PerplexityAgentResponse): PerplexityClientError {
  const detail = response?.error;
  const message =
    typeof detail === "object" && detail?.message
      ? detail.message
      : `Perplexity generation ${response?.status ?? "failed"}.`;
  return new PerplexityClientError(message, "unknown");
}

export async function validateApiKey(apiKey: string): Promise<void> {
  try {
    const response = await fetch(`${PERPLEXITY_BASE_URL}/v1/agent`, {
      method: "POST",
      headers: headers(apiKey),
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        input: "Reply OK.",
        max_output_tokens: 1,
      }),
    });
    await assertSuccessful(response);

    const result = (await response.json()) as PerplexityAgentResponse;
    if (result.status && result.status !== "completed") {
      throw terminalError(result);
    }
  } catch (error) {
    throw normalizePerplexityError(error);
  }
}

export async function listModels(
  apiKey: string,
): Promise<{ id: string }[]> {
  try {
    const response = await fetch(`${PERPLEXITY_BASE_URL}/v1/models`, {
      headers: headers(apiKey),
    });
    await assertSuccessful(response);

    const result = (await response.json()) as PerplexityModelsResponse;
    return result.data
      .filter((model) => typeof model.id === "string" && model.id.length > 0)
      .sort((a, b) => {
        if (a.id === DEFAULT_MODEL) return -1;
        if (b.id === DEFAULT_MODEL) return 1;
        return a.id.localeCompare(b.id);
      });
  } catch (error) {
    throw normalizePerplexityError(error);
  }
}

function parseEvent(block: string): PerplexityStreamEvent | null {
  const data = block
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");

  if (!data || data === "[DONE]") return null;
  return JSON.parse(data) as PerplexityStreamEvent;
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
  try {
    const response = await fetch(`${PERPLEXITY_BASE_URL}/v1/agent`, {
      method: "POST",
      headers: headers(apiKey),
      signal: options?.signal,
      body: JSON.stringify({
        model: options?.modelId ?? DEFAULT_MODEL,
        input: messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        stream: true,
      }),
    });
    await assertSuccessful(response);

    if (!response.body) {
      throw new PerplexityClientError(
        "Perplexity returned an empty response stream.",
        "unknown",
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    let usage: ProviderTokenUsage | undefined;
    let terminalStatus: PerplexityAgentResponse["status"];

    const processBlock = (block: string) => {
      const event = parseEvent(block);
      if (!event) return;

      if (event.type === "response.output_text.delta" && event.delta) {
        text += event.delta;
        options?.onChunk?.(event.delta);
      }

      if (event.type === "error") {
        throw new PerplexityClientError(
          event.error?.message ?? "Perplexity's response stream failed.",
          "unknown",
        );
      }

      if (
        event.type === "response.completed" ||
        event.type === "response.failed" ||
        event.type === "response.incomplete" ||
        event.type === "response.cancelled"
      ) {
        terminalStatus =
          event.response?.status ??
          (event.type.slice("response.".length) as PerplexityAgentResponse["status"]);
        usage = toUsage(event.response?.usage);
        if (event.type !== "response.completed") {
          throw terminalError(event.response);
        }
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });

      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() ?? "";
      blocks.forEach(processBlock);

      if (done) break;
    }

    if (buffer.trim()) processBlock(buffer);
    if (terminalStatus !== "completed") {
      throw terminalError({ status: terminalStatus });
    }

    return { text, ...(usage ? { usage } : {}) };
  } catch (error) {
    if (
      options?.signal?.aborted ||
      (error instanceof Error && error.name === "AbortError")
    ) {
      throw error;
    }
    throw normalizePerplexityError(error);
  }
}
