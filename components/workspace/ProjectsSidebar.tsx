"use client";

import { useState } from "react";
import type { Project } from "@/lib/projects/ProjectRepository";

interface ProjectsSidebarProps {
  projects: Project[];
  activeProjectId: string;
  disabled: boolean;
  onCreate: (name: string) => void;
  onRename: (projectId: string, name: string) => void;
  onDelete: (projectId: string) => void;
  onSelect: (projectId: string) => void;
}

const actionStyle = {
  fontFamily: "var(--font-body)",
  fontSize: "0.7rem",
  color: "var(--color-muted)",
  background: "transparent",
  border: "none",
  padding: 0,
};

export default function ProjectsSidebar({
  projects,
  activeProjectId,
  disabled,
  onCreate,
  onRename,
  onDelete,
  onSelect,
}: ProjectsSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  function startRename(project: Project) {
    setEditingId(project.id);
    setEditingName(project.name);
  }

  function submitRename() {
    if (!editingId || !editingName.trim()) return;
    onRename(editingId, editingName.trim());
    setEditingId(null);
    setEditingName("");
  }

  return (
    <aside
      aria-label="Projects"
      className="w-full shrink-0 lg:sticky lg:top-8 lg:w-[220px]"
    >
      <div
        className="rounded-lg"
        style={{
          background: "var(--color-glass)",
          border: "1px solid var(--color-border)",
          padding: "14px",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "var(--color-text)",
              margin: 0,
            }}
          >
            Projects
          </h2>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              const name = window.prompt("Project name");
              if (name?.trim()) onCreate(name.trim());
            }}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.75rem",
              color: "var(--color-text)",
              background: "var(--color-glass)",
              border: "1px solid var(--color-border)",
              borderRadius: 999,
              padding: "4px 9px",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.6 : 1,
              flexShrink: 0,
            }}
          >
            + New Project
          </button>
        </div>

        <ul className="mt-3 flex flex-col gap-2">
          {projects.map((project) => {
            const isActive = project.id === activeProjectId;
            const isEditing = project.id === editingId;

            return (
              <li
                key={project.id}
                className="rounded-lg"
                style={{
                  background: isActive ? "var(--color-bg)" : "transparent",
                  border: isActive
                    ? "1px solid var(--color-border)"
                    : "1px solid transparent",
                  padding: "8px 10px",
                }}
              >
                {isEditing ? (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      submitRename();
                    }}
                    className="flex flex-col gap-2"
                  >
                    <label className="sr-only" htmlFor={`project-${project.id}`}>
                      Project name
                    </label>
                    <input
                      id={`project-${project.id}`}
                      autoFocus
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") setEditingId(null);
                      }}
                      className="w-full rounded-lg"
                      style={{
                        background: "var(--color-glass)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text)",
                        padding: "5px 8px",
                        fontFamily: "var(--font-body)",
                        fontSize: "0.8rem",
                      }}
                    />
                    <div className="flex items-center gap-3">
                      <button type="submit" style={actionStyle}>
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        style={actionStyle}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={disabled || isActive}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => onSelect(project.id)}
                      className="w-full text-left"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.82rem",
                        fontWeight: isActive ? 600 : 500,
                        color: isActive
                          ? "var(--color-accent)"
                          : "var(--color-text)",
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        cursor:
                          disabled || isActive ? "default" : "pointer",
                      }}
                    >
                      {project.name}
                    </button>
                    <div className="mt-1 flex items-center gap-3">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => startRename(project)}
                        style={{
                          ...actionStyle,
                          cursor: disabled ? "not-allowed" : "pointer",
                          opacity: disabled ? 0.6 : 1,
                        }}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onDelete(project.id)}
                        style={{
                          ...actionStyle,
                          cursor: disabled ? "not-allowed" : "pointer",
                          opacity: disabled ? 0.6 : 1,
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
