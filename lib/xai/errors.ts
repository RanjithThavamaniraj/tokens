export type XAIErrorKind =
  | "invalid_api_key"
  | "forbidden"
  | "rate_limited"
  | "timeout"
  | "network_error"
  | "unknown";

export class XAIClientError extends Error {
  readonly kind: XAIErrorKind;

  constructor(message: string, kind: XAIErrorKind) {
    super(message);
    this.name =
      kind === "invalid_api_key" ? "AuthenticationError" : "XAIClientError";
    this.kind = kind;
  }
}

export function normalizeXAIError(error: unknown): XAIClientError {
  if (error instanceof XAIClientError) return error;

  if (
    (error instanceof Error && error.name === "AbortError") ||
    (error instanceof Error && /timed?\s?out|timeout/i.test(error.message))
  ) {
    return new XAIClientError(
      "The request to xAI timed out. Please try again.",
      "timeout",
    );
  }

  const status = (error as { status?: unknown } | null)?.status;
  if (typeof status === "number") {
    switch (status) {
      case 401:
        return new XAIClientError("Invalid API key.", "invalid_api_key");
      case 403:
        return new XAIClientError(
          "This API key doesn't have permission to access this resource.",
          "forbidden",
        );
      case 429:
        return new XAIClientError(
          "Rate limited by xAI. Please try again shortly.",
          "rate_limited",
        );
      default:
        if (status >= 500) {
          return new XAIClientError(
            "xAI is temporarily unavailable. Please try again.",
            "unknown",
          );
        }
        return new XAIClientError(
          "Unable to connect to xAI. Please try again.",
          "unknown",
        );
    }
  }

  return new XAIClientError(
    "We couldn't reach xAI. Please check your internet connection or try again.",
    "network_error",
  );
}
