import type {
  PerplexityErrorPayload,
  PerplexityErrorResponse,
} from "./types";

export type PerplexityErrorKind =
  | "invalid_api_key"
  | "invalid_request"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "server_error"
  | "timeout"
  | "network_error"
  | "unknown";

export class PerplexityClientError extends Error {
  readonly kind: PerplexityErrorKind;
  readonly status?: number;

  constructor(
    message: string,
    kind: PerplexityErrorKind,
    status?: number,
  ) {
    super(message);
    this.name =
      kind === "invalid_api_key"
        ? "AuthenticationError"
        : "PerplexityClientError";
    this.kind = kind;
    this.status = status;
  }
}

function payloadMessage(payload?: PerplexityErrorPayload | string): string | undefined {
  if (typeof payload === "string") return payload;
  return payload?.message;
}

export function createPerplexityHttpError(
  status: number,
  body?: PerplexityErrorResponse,
): PerplexityClientError {
  const detail = payloadMessage(body?.error) ?? body?.message;

  switch (status) {
    case 400:
      return new PerplexityClientError(
        detail ?? "Perplexity rejected the request.",
        "invalid_request",
        status,
      );
    case 401:
      return new PerplexityClientError(
        "Invalid API key.",
        "invalid_api_key",
        status,
      );
    case 403:
      return new PerplexityClientError(
        detail ?? "This API key doesn't have permission to access this resource.",
        "forbidden",
        status,
      );
    case 404:
      return new PerplexityClientError(
        detail ?? "The requested Perplexity resource was not found.",
        "not_found",
        status,
      );
    case 429:
      return new PerplexityClientError(
        "Rate limited by Perplexity. Please try again shortly.",
        "rate_limited",
        status,
      );
    default:
      if (status >= 500) {
        return new PerplexityClientError(
          "Perplexity is temporarily unavailable. Please try again.",
          "server_error",
          status,
        );
      }
      return new PerplexityClientError(
        detail ?? "Unable to connect to Perplexity.",
        "unknown",
        status,
      );
  }
}

export function normalizePerplexityError(error: unknown): PerplexityClientError {
  if (
    (error instanceof Error && error.name === "AbortError") ||
    (error instanceof Error && /timed?\s?out|timeout/i.test(error.message))
  ) {
    return new PerplexityClientError(
      "The request to Perplexity timed out. Please try again.",
      "timeout",
    );
  }

  if (error instanceof PerplexityClientError) return error;
  return new PerplexityClientError(
    error instanceof TypeError
      ? "We couldn't reach Perplexity. Please check your internet connection or try again."
      : "Unable to connect to Perplexity. Please try again.",
    error instanceof TypeError ? "network_error" : "unknown",
  );
}
