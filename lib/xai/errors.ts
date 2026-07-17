export type XAIErrorKind =
  | "invalid_api_key"
  | "forbidden"
  | "rate_limited"
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
        return new XAIClientError(
          "Unable to connect to xAI. Please try again.",
          "unknown",
        );
    }
  }

  return new XAIClientError(
    "Network error. Check your connection and try again.",
    "network_error",
  );
}
