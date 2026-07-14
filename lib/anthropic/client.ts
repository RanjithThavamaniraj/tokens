import Anthropic from "@anthropic-ai/sdk";
import type { AnthropicModelSummary } from "./types";
import { normalizeAnthropicError } from "./errors";

function createSdkClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

// Used for BOTH validation (connect() calls this and discards the result —
// if it doesn't throw, the key is valid) AND real model retrieval
// (getModels() calls this and returns the result). No caching anywhere in
// this file — every call hits the network.
export async function listModels(apiKey: string): Promise<AnthropicModelSummary[]> {
  try {
    const client = createSdkClient(apiKey);
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
export async function generateCompletion(
  apiKey: string,
  request: { systemPrompt?: string; userPrompt: string },
): Promise<string> {
  try {
    const client = createSdkClient(apiKey);
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      ...(request.systemPrompt ? { system: request.systemPrompt } : {}),
      messages: [{ role: "user" as const, content: request.userPrompt }],
    });
    const textBlock = response.content.find(
      (block): block is Extract<typeof block, { type: "text" }> => block.type === "text",
    );
    return textBlock?.text ?? "";
  } catch (error) {
    throw normalizeAnthropicError(error);
  }
}
