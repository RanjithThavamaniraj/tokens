// Minimal, local types decoupled from the `openai` npm package's own types.
// OpenAIProvider should never import SDK types directly — this keeps a
// future backend migration (UI -> OpenAIProvider -> Backend API -> OpenAI
// SDK) from leaking SDK-specific shapes into the provider layer.

export interface OpenAIModelSummary {
  id: string;
}
