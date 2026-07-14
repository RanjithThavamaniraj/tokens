// Session-scoped credential storage bridging the provider connection UI
// (IntegrationPanel) and prompt execution (Workspace) without ever asking
// the user to re-enter credentials they've already provided.
//
// Deliberately uses `window.sessionStorage`, NEVER `localStorage` — API keys
// should not persist beyond the browser tab's lifetime.

import type { ProviderId } from "@/lib/providers/Provider";

export interface ConnectionManager {
  save(providerId: ProviderId, credentials: Record<string, string>): Promise<void>;
  get(providerId: ProviderId): Promise<Record<string, string> | null>;
  isConnected(providerId: ProviderId): Promise<boolean>;
  clear(providerId: ProviderId): Promise<void>;
}

function storageKey(providerId: ProviderId): string {
  return `tokens:connection:${providerId}`;
}

/**
 * sessionStorage-backed implementation. All methods return Promises even
 * though this implementation resolves synchronously/immediately — this is
 * deliberate, so a future backend-backed implementation (async, real
 * network calls) can replace this class by swapping what's assigned to
 * `connectionManager`, with ZERO changes to any call site anywhere in the
 * app, since callers already `await` these methods.
 */
class SessionStorageConnectionManager implements ConnectionManager {
  async save(providerId: ProviderId, credentials: Record<string, string>): Promise<void> {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(storageKey(providerId), JSON.stringify(credentials));
  }

  async get(providerId: ProviderId): Promise<Record<string, string> | null> {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(storageKey(providerId));
    if (raw === null) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        return null;
      }
      return parsed as Record<string, string>;
    } catch {
      return null;
    }
  }

  async isConnected(providerId: ProviderId): Promise<boolean> {
    if (typeof window === "undefined") return false;
    const credentials = await this.get(providerId);
    return credentials !== null;
  }

  async clear(providerId: ProviderId): Promise<void> {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(storageKey(providerId));
  }
}

// The ONE thing Workspace and IntegrationPanel should ever import from this
// file.
export const connectionManager: ConnectionManager = new SessionStorageConnectionManager();
