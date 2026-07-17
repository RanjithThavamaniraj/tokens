"use client";

import type { SettingsSectionId } from "@/lib/settings/types";
import { SETTINGS_SECTIONS } from "@/lib/settings/defaults";

export default function SettingsSidebar({
  active,
  onSelect,
}: {
  active: SettingsSectionId;
  onSelect: (id: SettingsSectionId) => void;
}) {
  return (
    <aside
      aria-label="Settings sections"
      className="w-full shrink-0 lg:sticky lg:top-8 lg:w-[220px]"
    >
      <nav
        className="rounded-lg"
        style={{
          background: "var(--color-glass)",
          border: "1px solid var(--color-border)",
          padding: 10,
        }}
      >
        <ul className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
          {SETTINGS_SECTIONS.map((section) => {
            const isActive = section.id === active;
            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => onSelect(section.id)}
                  aria-current={isActive ? "page" : undefined}
                  className="w-full whitespace-nowrap rounded-lg text-left"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "0.85rem",
                    fontWeight: isActive ? 600 : 500,
                    color: isActive
                      ? "var(--color-accent)"
                      : "var(--color-text)",
                    background: isActive ? "var(--color-bg)" : "transparent",
                    border: isActive
                      ? "1px solid var(--color-border)"
                      : "1px solid transparent",
                    padding: "8px 12px",
                    cursor: "pointer",
                  }}
                >
                  {section.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
