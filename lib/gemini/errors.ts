export type GeminiErrorKind =
  | "invalid_api_key"
  | "forbidden"
  | "rate_limited"
  | "timeout"
  | "network_error"
  | "unknown";

export class GeminiClientError extends Error {
  readonly kind: GeminiErrorKind;
  constructor(message: string, kind: GeminiErrorKind) {
    super(message);
    this.name = kind === "invalid_api_key" ? "AuthenticationError" : "GeminiClientError";
    this.kind = kind;
  }
}

/**
 * Maps the official SDK's error shape to a friendly GeminiClientError.
 *
 * The `@google/genai` package throws `ApiError` with a `.status` number for
 * HTTP-level errors. We duck-type on `.status` rather than importing the
 * SDK's error classes so this stays simple and doesn't couple us to SDK
 * internals beyond the one property we need.
 *
 * Naming convention: the resulting error's `.name` is `"AuthenticationError"`
 * when `kind === "invalid_api_key"`, and `"GeminiClientError"` for every
 * other kind. This lets fully generic, provider-agnostic UI code (e.g.
 * IntegrationPanel, which is shared across all providers and must not import
 * Gemini-specific types) distinguish "the credential is no longer valid, the
 * user should reconnect" from "some other recoverable failure" purely via
 * the standard `Error.name` property.
 */
export function normalizeGeminiError(error: unknown): GeminiClientError {
  if (error instanceof GeminiClientError) {
    return error;
  }

  if (
    (error instanceof Error && error.name === "AbortError") ||
    (error instanceof Error && /timed?\s?out|timeout/i.test(error.message))
  ) {
    return new GeminiClientError(
      "The request to Gemini timed out. Please try again.",
      "timeout",
    );
  }

  const message =
    typeof (error as { message?: unknown } | null)?.message === "string"
      ? (error as { message: string }).message
      : "";

  // Gemini's API often reports an invalid key via message text (e.g.
  // "API key not valid. Please pass a valid API key.") even when the
  // `.status` is a generic 400, so we check the message first.
  if (
    /api[_ ]?key[_ ]?not[_ ]?valid/i.test(message) ||
    /API_KEY_INVALID/i.test(message) ||
    /invalid api key/i.test(message)
  ) {
    return new GeminiClientError("Invalid API key.", "invalid_api_key");
  }

  const status = (error as { status?: unknown } | null)?.status;

  if (typeof status === "number") {
    switch (status) {
      case 401:
        return new GeminiClientError("Invalid API key.", "invalid_api_key");
      case 403:
        return new GeminiClientError(
          "This API key doesn't have permission to access this resource.",
          "forbidden",
        );
      case 429:
        return new GeminiClientError(
          "Rate limited by Gemini. Please try again shortly.",
          "rate_limited",
        );
      case 400:
        // Do NOT blanket-map 400 to invalid key — the message regex above
        // already catches real invalid-key 400s. Other 400s are generic
        // request errors.
        return new GeminiClientError(
          "Unable to connect to Gemini. Please try again.",
          "unknown",
        );
      default:
        if (status >= 500) {
          return new GeminiClientError(
            "Gemini is temporarily unavailable. Please try again.",
            "unknown",
          );
        }
        return new GeminiClientError(
          "Unable to connect to Gemini. Please try again.",
          "unknown",
        );
    }
  }

  // No `.status` present: either a connection-level failure or a plain
  // network failure (e.g. TypeError from fetch).
  return new GeminiClientError(
    "We couldn't reach Gemini. Please check your internet connection or try again.",
    "network_error",
  );
}
