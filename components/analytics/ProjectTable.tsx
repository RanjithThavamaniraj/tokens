"use client";

import type { CSSProperties } from "react";
import type { ProjectAnalytics } from "@/lib/analytics/types";

export default function ProjectTable({
  projects,
}: {
  projects: ProjectAnalytics[];
}) {
  if (projects.length === 0) {
    return (
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "0.85rem",
          color: "var(--color-muted)",
          margin: 0,
        }}
      >
        No projects found.
      </p>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-lg"
      style={{
        background: "var(--color-glass)",
        border: "1px solid var(--color-border)",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
        <thead>
          <tr>
            {["Project", "Conversations", "Prompts", "Responses", "Last updated"].map(
              (header) => (
                <th key={header} style={thStyle}>
                  {header}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.projectId}>
              <td style={tdStyle}>{project.name}</td>
              <td style={tdStyle}>{project.conversationCount}</td>
              <td style={tdStyle}>{project.promptCount}</td>
              <td style={tdStyle}>{project.responseCount}</td>
              <td style={tdStyle}>
                {new Date(project.lastUpdated).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "10px 14px",
  fontFamily: "var(--font-body)",
  fontSize: "0.72rem",
  color: "var(--color-muted)",
  borderBottom: "1px solid var(--color-border)",
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  padding: "12px 14px",
  fontFamily: "var(--font-body)",
  fontSize: "0.85rem",
  color: "var(--color-text)",
  borderBottom: "1px solid var(--color-border)",
};
