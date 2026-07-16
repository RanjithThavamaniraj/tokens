import OpenAI from "openai";
import type { Message } from "@/lib/providers/Provider";
import type { OpenAIModelSummary } from "./types";
import { normalizeOpenAIError } from "./errors";

function createSdkClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
}

// Used for BOTH validation (connect() calls this and discards the result —
// if it doesn't throw, the key is valid) AND real model retrieval
// (getModels() calls this and returns the result). No caching anywhere in
// this file — every call hits the network.
export async function listModels(apiKey: string): Promise<OpenAIModelSummary[]> {
  try {
    const client = createSdkClient(apiKey);
    const response = await client.models.list();
    const models = response.data.map((model) => ({ id: model.id }));
    models.sort((a, b) => a.id.localeCompare(b.id));
    return models;
  } catch (error) {
    throw normalizeOpenAIError(error);
  }
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
): Promise<string> {
  try {
    const client = createSdkClient(apiKey);
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    });
    return response.choices[0]?.message?.content ?? "";
  } catch (error) {
    throw normalizeOpenAIError(error);
  }
}
