export const ONBOARDING_STORAGE_KEY = "tokens:onboarding:v1";
export const ONBOARDING_PROMPT_KEY = "tokens:onboarding-prompt:v1";
export const ONBOARDING_VERSION = 1;

export type OnboardingStepId =
  | "welcome"
  | "providers"
  | "project"
  | "prompt"
  | "decision"
  | "finish";

export interface OnboardingState {
  version: number;
  completed: boolean;
  completedAt: string | null;
}

export interface OnboardingPromptHandoff {
  userPrompt: string;
  systemPrompt?: string;
}

export const ONBOARDING_STEPS: {
  id: OnboardingStepId;
  label: string;
}[] = [
  { id: "welcome", label: "Welcome" },
  { id: "providers", label: "Providers" },
  { id: "project", label: "Project" },
  { id: "prompt", label: "Prompt" },
  { id: "decision", label: "Decisions" },
  { id: "finish", label: "Ready" },
];

export const EXAMPLE_PROMPTS = [
  {
    id: "react-vue",
    label: "Compare React vs Vue",
    prompt:
      "Compare React and Vue for a mid-size product dashboard. Cover DX, performance, ecosystem, hiring, and when to choose each.",
  },
  {
    id: "rest-api",
    label: "Design a REST API",
    prompt:
      "Design a REST API for a task management product. Include resources, endpoints, auth, pagination, and error conventions.",
  },
  {
    id: "kubernetes",
    label: "Explain Kubernetes",
    prompt:
      "Explain Kubernetes to a senior engineer new to containers. Cover pods, deployments, services, and a simple production mental model.",
  },
] as const;

export const PROJECT_NAME_SUGGESTIONS = [
  "My Project",
  "Research",
  "Product Decisions",
  "Interview Prep",
] as const;
