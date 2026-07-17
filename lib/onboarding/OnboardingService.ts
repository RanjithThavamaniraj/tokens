import {
  onboardingRepository,
  type OnboardingRepository,
} from "./OnboardingRepository";
import type { OnboardingPromptHandoff, OnboardingState } from "./types";
import { ONBOARDING_PROMPT_KEY, ONBOARDING_VERSION } from "./types";

export class OnboardingService {
  constructor(private readonly repository: OnboardingRepository) {}

  async getState(): Promise<OnboardingState> {
    return this.repository.load();
  }

  async isCompleted(): Promise<boolean> {
    const state = await this.repository.load();
    return state.completed;
  }

  async complete(): Promise<OnboardingState> {
    const state: OnboardingState = {
      version: ONBOARDING_VERSION,
      completed: true,
      completedAt: new Date().toISOString(),
    };
    await this.repository.save(state);
    return state;
  }

  /** Clears completion so Settings can relaunch the wizard. */
  async relaunch(): Promise<OnboardingState> {
    const state: OnboardingState = {
      version: ONBOARDING_VERSION,
      completed: false,
      completedAt: null,
    };
    await this.repository.save(state);
    return state;
  }

  stashPrompt(handoff: OnboardingPromptHandoff): void {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(
      ONBOARDING_PROMPT_KEY,
      JSON.stringify(handoff),
    );
  }

  consumePrompt(): OnboardingPromptHandoff | null {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(ONBOARDING_PROMPT_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(ONBOARDING_PROMPT_KEY);
    try {
      const parsed: unknown = JSON.parse(raw);
      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed) ||
        typeof (parsed as OnboardingPromptHandoff).userPrompt !== "string"
      ) {
        return null;
      }
      const handoff = parsed as OnboardingPromptHandoff;
      return {
        userPrompt: handoff.userPrompt,
        systemPrompt:
          typeof handoff.systemPrompt === "string"
            ? handoff.systemPrompt
            : undefined,
      };
    } catch {
      return null;
    }
  }
}

export const onboardingService = new OnboardingService(onboardingRepository);
