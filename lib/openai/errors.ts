export type OpenAIErrorKind =
  | "invalid_api_key"
  | "forbidden"
  | "rate_limited"
  | "network_error"
  | "unknown";

export class OpenAIClientError extends Error {
  readonly kind: OpenAIErrorKind;
  constructor(message: string, kind: OpenAIErrorKind) {
    super(message);
    this.name = "OpenAIClientError";
    this.kind = kind;
  }
}

/**
 * Maps the official SDK's error shape to a friendly OpenAIClientError.
 *
 * The `openai` SDK throws APIError subclasses with a `.status` number for
 * HTTP-level errors. We duck-type on `.status` rather than importing the
 * SDK's error classes so this stays simple and doesn't couple us to SDK
 * internals beyond the one property we need.
 */
export function normalizeOpenAIError(error: unknown): OpenAIClientError {
  if (error instanceof OpenAIClientError) {
    return error;
  }

  const status = (error as { status?: unknown } | null)?.status;

  if (typeof status === "number") {
    switch (status) {
      case 401:
        return new OpenAIClientError("Invalid API key.", "invalid_api_key");
      case 403:
        return new OpenAIClientError(
          "This API key doesn't have permission to access this resource.",
          "forbidden",
        );
      case 429:
        return new OpenAIClientError(
          "Rate limited by OpenAI. Please try again shortly.",
          "rate_limited",
        );
      default:
        return new OpenAIClientError(
          "Unable to connect to OpenAI. Please try again.",
          "unknown",
        );
    }
  }

  // No `.status` present: either a connection-level failure (e.g. the SDK's
  // APIConnectionError) or a plain network failure (e.g. TypeError from
  // fetch).
  return new OpenAIClientError(
    "Network error. Check your connection and try again.",
    "network_error",
  );
}
