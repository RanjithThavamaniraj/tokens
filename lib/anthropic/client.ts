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
