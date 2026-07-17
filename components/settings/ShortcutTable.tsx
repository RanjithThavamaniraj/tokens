"use client";

import { KEYBOARD_SHORTCUTS } from "@/lib/settings/defaults";

export default function ShortcutTable({ isMac }: { isMac: boolean }) {
  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{
        background: "var(--color-glass)",
        border: "1px solid var(--color-border)",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                padding: "10px 14px",
                fontFamily: "var(--font-body)",
                fontSize: "0.75rem",
                color: "var(--color-muted)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              Shortcut
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "10px 14px",
                fontFamily: "var(--font-body)",
                fontSize: "0.75rem",
                color: "var(--color-muted)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {KEYBOARD_SHORTCUTS.map((shortcut) => (
            <tr key={shortcut.id}>
              <td
                style={{
                  padding: "12px 14px",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.85rem",
                  color: "var(--color-text)",
                  borderBottom: "1px solid var(--color-border)",
                  whiteSpace: "nowrap",
                }}
              >
                <kbd
                  style={{
                    border: "1px solid var(--color-border)",
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontSize: "0.78rem",
                  }}
                >
                  {isMac && shortcut.macKeys ? shortcut.macKeys : shortcut.keys}
                </kbd>
              </td>
              <td
                style={{
                  padding: "12px 14px",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.85rem",
                  color: "var(--color-muted)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                {shortcut.action}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
