export interface PerplexityModelSummary {
  id: string;
}

export interface PerplexityModelsResponse {
  data: PerplexityModelSummary[];
}

export interface PerplexityUsage {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
}

export interface PerplexityAgentResponse {
  status?: "completed" | "failed" | "incomplete" | "cancelled";
  usage?: PerplexityUsage;
  error?: PerplexityErrorPayload | null;
}

export interface PerplexityStreamEvent {
  type: string;
  delta?: string;
  response?: PerplexityAgentResponse;
  error?: PerplexityErrorPayload;
}

export interface PerplexityErrorPayload {
  message?: string;
  type?: string;
  code?: string | number;
}

export interface PerplexityErrorResponse {
  error?: PerplexityErrorPayload | string;
  message?: string;
}
