// Minimal, local types decoupled from the `@anthropic-ai/sdk` npm package's
// own types. ClaudeProvider should never import SDK types directly — this
// keeps a future backend migration (UI -> ClaudeProvider -> Backend API ->
// Anthropic SDK) from leaking SDK-specific shapes into the provider layer.

export interface AnthropicModelSummary {
  id: string;
  displayName: string;
}
