// Minimal, local types decoupled from the `@google/genai` npm package's own
// types. GeminiProvider should never import SDK types directly — this keeps
// a future backend migration (UI -> GeminiProvider -> Backend API ->
// Google GenAI SDK) from leaking SDK-specific shapes into the provider
// layer.

export interface GeminiModelSummary {
  id: string;
  displayName: string;
}
