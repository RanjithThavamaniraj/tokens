export type AnthropicErrorKind =
  | "invalid_api_key"
  | "forbidden"
  | "rate_limited"
  | "timeout"
  | "network_error"
  | "unknown";

export class AnthropicClientError extends Error {
  readonly kind: AnthropicErrorKind;
  constructor(message: string, kind: AnthropicErrorKind) {
    super(message);
    this.name = kind === "invalid_api_key" ? "AuthenticationError" : "AnthropicClientError";
    this.kind = kind;
  }
}

/**
 * Maps the official SDK's error shape to a friendly AnthropicClientError.
 *
 * The `@anthropic-ai/sdk` package throws APIError subclasses with a
 * `.status` number for HTTP-level errors. We duck-type on `.status` rather
 * than importing the SDK's error classes so this stays simple and doesn't
 * couple us to SDK internals beyond the one property we need.
 *
 * Naming convention: the resulting error's `.name` is `"AuthenticationError"`
 * when `kind === "invalid_api_key"`, and `"AnthropicClientError"` for every
 * other kind. This lets fully generic, provider-agnostic UI code (e.g.
 * IntegrationPanel, which is shared across all providers and must not import
 * Anthropic-specific types) distinguish "the credential is no longer valid,
 * the user should reconnect" from "some other recoverable failure" purely
 * via the standard `Error.name` property.
 */
export function normalizeAnthropicError(error: unknown): AnthropicClientError {
  if (error instanceof AnthropicClientError) {
    return error;
  }

  if (
    (error instanceof Error && error.name === "AbortError") ||
    (error instanceof Error && /timed?\s?out|timeout/i.test(error.message))
  ) {
    return new AnthropicClientError(
      "The request to Anthropic timed out. Please try again.",
      "timeout",
    );
  }

  const status = (error as { status?: unknown } | null)?.status;

  if (typeof status === "number") {
    switch (status) {
      case 401:
        return new AnthropicClientError("Invalid API key.", "invalid_api_key");
      case 403:
        return new AnthropicClientError(
          "This API key doesn't have permission to access this resource.",
          "forbidden",
        );
      case 429:
        return new AnthropicClientError(
          "Rate limited by Anthropic. Please try again shortly.",
          "rate_limited",
        );
      default:
        if (status >= 500) {
          return new AnthropicClientError(
            "Anthropic is temporarily unavailable. Please try again.",
            "unknown",
          );
        }
        return new AnthropicClientError(
          "Unable to connect to Anthropic. Please try again.",
          "unknown",
        );
    }
  }

  // No `.status` present: either a connection-level failure (e.g. the SDK's
  // APIConnectionError) or a plain network failure (e.g. TypeError from
  // fetch).
  return new AnthropicClientError(
    "We couldn't reach Anthropic. Please check your internet connection or try again.",
    "network_error",
  );
}
