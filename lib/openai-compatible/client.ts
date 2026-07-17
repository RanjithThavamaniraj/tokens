import OpenAI from "openai";
import type {
  Message,
  ProviderExecutionResult,
  ProviderTokenUsage,
} from "@/lib/providers/Provider";

interface OpenAICompatibleClientOptions {
  apiKey: string;
  baseURL?: string;
  normalizeError: (error: unknown) => Error;
}

interface StreamCompletionOptions extends OpenAICompatibleClientOptions {
  messages: Message[];
  model: string;
  signal?: AbortSignal;
  onChunk?: (chunk: string) => void;
}

function createClient({
  apiKey,
  baseURL,
}: OpenAICompatibleClientOptions): OpenAI {
  return new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
    dangerouslyAllowBrowser: true,
  });
}

function isAbort(error: unknown, signal?: AbortSignal): boolean {
  return (
    signal?.aborted === true ||
    (error instanceof Error && error.name === "AbortError")
  );
}

export async function listOpenAICompatibleModels(
  options: OpenAICompatibleClientOptions,
): Promise<{ id: string }[]> {
  try {
    const response = await createClient(options).models.list();
    const models = response.data.map((model) => ({ id: model.id }));
    models.sort((a, b) => a.id.localeCompare(b.id));
    return models;
  } catch (error) {
    throw options.normalizeError(error);
  }
}

export async function streamOpenAICompatibleCompletion({
  apiKey,
  baseURL,
  messages,
  model,
  signal,
  onChunk,
  normalizeError,
}: StreamCompletionOptions): Promise<ProviderExecutionResult> {
  try {
    const stream = await createClient({
      apiKey,
      baseURL,
      normalizeError,
    }).chat.completions.create(
      {
        model,
        messages: messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        stream: true,
        stream_options: { include_usage: true },
      },
      { signal },
    );

    let text = "";
    let usage: ProviderTokenUsage | undefined;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content ?? "";
      if (content) {
        text += content;
        onChunk?.(content);
      }
      if (chunk.usage) {
        usage = {
          inputTokens: chunk.usage.prompt_tokens,
          outputTokens: chunk.usage.completion_tokens,
          totalTokens: chunk.usage.total_tokens,
        };
      }
    }

    return { text, ...(usage ? { usage } : {}) };
  } catch (error) {
    if (isAbort(error, signal)) throw error;
    throw normalizeError(error);
  }
}
