import { GoogleGenAI, type Model } from "@google/genai";
import type { Message } from "@/lib/providers/Provider";
import type { GeminiModelSummary } from "./types";
import { normalizeGeminiError } from "./errors";

function createSdkClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({ apiKey });
}

// Used for BOTH validation (connect() calls this and discards the result —
// if it doesn't throw, the key is valid) AND real model retrieval
// (getModels() calls this and returns the result). No caching anywhere in
// this file — every call hits the network.
export async function listModels(apiKey: string): Promise<GeminiModelSummary[]> {
  try {
    const client = createSdkClient(apiKey);
    // `queryBase: true` is required to list base Gemini models — without it
    // the API lists the caller's tuned models instead.
    const pager = await client.models.list({ config: { queryBase: true } });
    const summaries: GeminiModelSummary[] = [];
    for await (const model of pager) {
      const typedModel: Model = model;
      if (!typedModel.name) continue;
      summaries.push({
        id: typedModel.name,
        displayName: typedModel.displayName ?? typedModel.name,
      });
    }
    summaries.sort((a, b) => a.displayName.localeCompare(b.displayName));
    return summaries;
  } catch (error) {
    throw normalizeGeminiError(error);
  }
}

// Used by GeminiProvider.executePrompt() for real prompt execution against
// the GenerateContent API. Request-scoped like listModels() above — no
// caching, no stored state.
//
// Model: "gemini-2.0-flash" — a real current fast/cheap Gemini model.
// The GenerateContent API keeps system instructions in a separate
// `config.systemInstruction` field and only accepts "user"/"model" roles
// inside `contents`, so generic system messages are hoisted out here and
// generic "assistant" roles are mapped to "model" — this file owns that
// format divergence, not callers.
export async function generateCompletion(
  apiKey: string,
  messages: Message[],
): Promise<string> {
  try {
    const systemInstruction = messages
      .filter((message) => message.role === "system")
      .map((message) => message.content)
      .join("\n\n");
    const contents = messages
      .filter(
        (message): message is Message & { role: "user" | "assistant" } =>
          message.role === "user" || message.role === "assistant",
      )
      .map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      }));

    const client = createSdkClient(apiKey);
    const response = await client.models.generateContent({
      model: "gemini-2.0-flash",
      contents,
      ...(systemInstruction ? { config: { systemInstruction } } : {}),
    });
    return response.text ?? "";
  } catch (error) {
    throw normalizeGeminiError(error);
  }
}
