export type MistralErrorKind =
  | "invalid_api_key"
  | "forbidden"
  | "rate_limited"
  | "timeout"
  | "network_error"
  | "unknown";

export class MistralClientError extends Error {
  readonly kind: MistralErrorKind;

  constructor(message: string, kind: MistralErrorKind) {
    super(message);
    this.name =
      kind === "invalid_api_key" ? "AuthenticationError" : "MistralClientError";
    this.kind = kind;
  }
}

export function normalizeMistralError(error: unknown): MistralClientError {
  if (error instanceof MistralClientError) return error;

  if (
    (error instanceof Error && error.name === "AbortError") ||
    (error instanceof Error && /timed?\s?out|timeout/i.test(error.message))
  ) {
    return new MistralClientError(
      "The request to Mistral AI timed out. Please try again.",
      "timeout",
    );
  }

  const status = (error as { status?: unknown } | null)?.status;
  if (typeof status === "number") {
    switch (status) {
      case 401:
        return new MistralClientError("Invalid API key.", "invalid_api_key");
      case 403:
        return new MistralClientError(
          "This API key doesn't have permission to access this resource.",
          "forbidden",
        );
      case 429:
        return new MistralClientError(
          "Rate limited by Mistral AI. Please try again shortly.",
          "rate_limited",
        );
      default:
        if (status >= 500) {
          return new MistralClientError(
            "Mistral AI is temporarily unavailable. Please try again.",
            "unknown",
          );
        }
        return new MistralClientError(
          "Unable to connect to Mistral AI. Please try again.",
          "unknown",
        );
    }
  }

  return new MistralClientError(
    "We couldn't reach Mistral AI. Please check your internet connection or try again.",
    "network_error",
  );
}
