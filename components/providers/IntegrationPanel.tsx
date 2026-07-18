"use client";

import { useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import type {
  ProviderId,
  ProviderIntegration,
  ProviderModel,
} from "@/lib/providers/Provider";
import { createProvider } from "@/lib/providers/ProviderFactory";
import { connectionManager } from "@/lib/connections/ConnectionManager";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

type ConnectStatus = "idle" | "connecting" | "success" | "error";

export default function IntegrationPanel({
  providerId,
  integration,
  onModelsResult,
  onDisconnect,
  onModelsLoadingChange,
}: {
  providerId: ProviderId;
  integration: ProviderIntegration;
  onModelsResult?: (
    result: { models: ProviderModel[] } | { error: string },
  ) => void;
  onDisconnect?: () => void;
  onModelsLoadingChange?: (loading: boolean) => void;
}) {
  const provider = useMemo(() => createProvider(providerId), [providerId]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<ConnectStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const oauthField = integration.fields.find(
    (field) => field.type === "oauth",
  );

  async function handleConnect() {
    if (!provider) return;
    setStatus("connecting");
    setErrorMessage(null);
    try {
      await provider.connect(values);
      await connectionManager.save(providerId, values);
      const models = await provider.getModels(values);
      setStatus("success");
      onModelsResult?.({ models });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to connect.";
      setStatus("error");
      setErrorMessage(message);
      onModelsResult?.({ error: message });
    }
  }

  async function resetToDisconnected(message?: string) {
    await provider?.disconnect(); // currently a no-op on every provider, but call it anyway for interface correctness / future-proofing
    await connectionManager.clear(providerId);
    setValues({});
    setRefreshError(null);
    setErrorMessage(message ?? null);
    setStatus(message ? "error" : "idle");
    onDisconnect?.();
  }

  async function handleRefresh() {
    if (!provider) return;
    setIsRefreshing(true);
    onModelsLoadingChange?.(true);
    setRefreshError(null);
    try {
      const models = await provider.getModels(values);
      onModelsResult?.({ models });
    } catch (error) {
      if (error instanceof Error && error.name === "AuthenticationError") {
        await resetToDisconnected("Your API key is no longer valid. Please reconnect.");
      } else {
        const message =
          error instanceof Error ? error.message : "Unable to refresh models.";
        setRefreshError(message);
      }
    } finally {
      setIsRefreshing(false);
      onModelsLoadingChange?.(false);
    }
  }

  const isConnecting = status === "connecting";
  const buttonLabel = isConnecting
    ? "Connecting..."
    : (oauthField ? oauthField.label : "Connect");

  return (
    <motion.div
      custom={3}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="mx-auto w-full max-w-[420px] text-left"
      style={{ marginTop: 32 }}
    >
      <h2
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.9rem",
          fontWeight: 600,
          color: "var(--color-text)",
        }}
      >
        {integration.title}
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.85rem",
          color: "var(--color-muted)",
          marginTop: 6,
        }}
      >
        {integration.description}
      </p>

      {integration.requiresAdmin && (
        <div
          className="rounded-lg"
          style={{
            marginTop: 16,
            padding: "10px 14px",
            background: "var(--color-glass)",
            border: "1px solid var(--color-border)",
            color: "var(--color-accent)",
            fontFamily: "var(--font-body)",
            fontSize: "0.8rem",
          }}
        >
          Requires an Enterprise admin-issued credential.
        </div>
      )}

      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.78rem",
          color: "var(--color-muted)",
          marginTop: 16,
        }}
      >
        {integration.instructions}
      </p>

      <div style={{ marginTop: 20 }} className="flex flex-col gap-4">
        {integration.fields
          .filter((field) => field.type !== "oauth")
          .map((field) => (
            <label key={field.id} className="flex flex-col gap-2">
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  color: "var(--color-text)",
                }}
              >
                {field.label}
                {field.required && (
                  <span
                    aria-hidden="true"
                    style={{ color: "var(--color-accent)", marginLeft: 4 }}
                  >
                    *
                  </span>
                )}
              </span>
              <input
                type={field.type}
                placeholder={field.placeholder}
                value={values[field.id] ?? ""}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    [field.id]: event.target.value,
                  }))
                }
                aria-invalid={status === "error" ? true : undefined}
                aria-describedby={
                  status === "error" && errorMessage
                    ? "integration-connect-error"
                    : undefined
                }
                className="w-full rounded-lg"
                style={{
                  background: "var(--color-glass)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  padding: "10px 14px",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.85rem",
                }}
              />
              {field.description && (
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.76rem",
                    color: "var(--color-muted)",
                  }}
                >
                  {field.description}
                </span>
              )}
            </label>
          ))}
      </div>

      <div style={{ marginTop: 20 }}>
        {status === "success" ? (
          <div>
            <p
              role="status"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--color-accent)",
                textAlign: "center",
              }}
            >
              Connected.
            </p>

            <div
              className="flex items-center gap-3"
              style={{ marginTop: 16 }}
            >
              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing || !provider}
                className="flex-1 rounded-full font-semibold"
                style={{
                  background: "#EE7B30",
                  color: "#06070B",
                  padding: "10px 20px",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.9rem",
                  opacity: isRefreshing || !provider ? 0.7 : 1,
                }}
              >
                {isRefreshing ? "Refreshing..." : "Refresh Models"}
              </button>
              <button
                type="button"
                onClick={() => resetToDisconnected()}
                className="flex-1 rounded-full font-semibold"
                style={{
                  background: "transparent",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  padding: "10px 20px",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.9rem",
                }}
              >
                Disconnect
              </button>
            </div>

            {refreshError && (
              <p
                role="alert"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.8rem",
                  color: "var(--color-muted)",
                  marginTop: 12,
                  textAlign: "center",
                }}
              >
                Couldn&apos;t refresh: {refreshError}
              </p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            disabled={isConnecting || !provider}
            className="w-full rounded-full font-semibold"
            style={{
              background: "#EE7B30",
              color: "#06070B",
              padding: "10px 20px",
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              opacity: isConnecting || !provider ? 0.7 : 1,
            }}
          >
            {buttonLabel}
          </button>
        )}

        {status === "error" && errorMessage && (
          <p
            id="integration-connect-error"
            role="alert"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.8rem",
              color: "var(--color-muted)",
              marginTop: 12,
              textAlign: "center",
            }}
          >
            {errorMessage}
          </p>
        )}
      </div>
    </motion.div>
  );
}
