import type { OnboardingState } from "./types";
import { ONBOARDING_STORAGE_KEY, ONBOARDING_VERSION } from "./types";

export interface OnboardingRepository {
  load(): Promise<OnboardingState>;
  save(state: OnboardingState): Promise<void>;
  clear(): Promise<void>;
}

function defaultState(): OnboardingState {
  return {
    version: ONBOARDING_VERSION,
    completed: false,
    completedAt: null,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

class LocalStorageOnboardingRepository implements OnboardingRepository {
  async load(): Promise<OnboardingState> {
    if (typeof window === "undefined") return defaultState();
    try {
      const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed: unknown = JSON.parse(raw);
      if (!isObject(parsed) || parsed.version !== ONBOARDING_VERSION) {
        return defaultState();
      }
      return {
        version: ONBOARDING_VERSION,
        completed: parsed.completed === true,
        completedAt:
          typeof parsed.completedAt === "string" ? parsed.completedAt : null,
      };
    } catch {
      return defaultState();
    }
  }

  async save(state: OnboardingState): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
  }

  async clear(): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  }
}

export const onboardingRepository: OnboardingRepository =
  new LocalStorageOnboardingRepository();
