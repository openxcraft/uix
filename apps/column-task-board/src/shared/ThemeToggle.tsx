import { useEffect } from "react";
import { IconButton, useLocalState } from "./ui";
import { strings } from "../i18n/strings";

export function applyTheme(mode: "light" | "dark" | "system"): void {
  document.documentElement.dataset.theme = mode === "system" ? "" : mode;
}

export function ThemeToggle() {
  const [mode, setMode] = useLocalState<"light" | "dark" | "system">(
    "column-task-board:theme",
    "system",
  );
  useEffect(() => {
    applyTheme(mode);
  }, [mode]);
  const next = mode === "light" ? "dark" : mode === "dark" ? "system" : "light";
  const label = mode === "light" ? strings.light : mode === "dark" ? strings.dark : strings.system;
  return (
    <IconButton label={`${strings.theme}: ${label}`} onClick={() => setMode(next)}>
      <svg
        viewBox="0 0 20 20"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="10" cy="10" r="3.5" />
        <path
          d="M10 2v2m0 12v2M2 10h2m12 0h2M4.5 4.5l1.4 1.4m8.2 8.2l1.4 1.4m0-11l-1.4 1.4M5.9 14.1l-1.4 1.4"
          strokeLinecap="round"
        />
      </svg>
    </IconButton>
  );
}
