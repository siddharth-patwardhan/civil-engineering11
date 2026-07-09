import { useState, useEffect, useCallback, useRef, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useDarkMode } from "./DarkModeProvider";
import { useProjectUiStore } from "@/features/project/projectUiStore";
import { projectPathOrLegacy, type ProjectScopedPage } from "@/features/project/projectRoutes";

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  icon: string;
  action: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toggle: toggleDarkMode } = useDarkMode();
  const activeProjectId = useProjectUiStore((s) => s.activeProjectId);

  const go = (page: ProjectScopedPage | null, legacy: string) => () =>
    navigate(page ? projectPathOrLegacy(activeProjectId, page) : legacy);

  const commands: CommandItem[] = [
    { id: "dash", label: "Go to Dashboard", shortcut: "Ctrl+1", icon: "dashboard", action: () => navigate("/dashboard") },
    { id: "proj", label: "Go to Projects", shortcut: "Ctrl+2", icon: "architecture", action: () => navigate("/projects") },
    { id: "meas", label: "Go to Measurement", shortcut: "Ctrl+3", icon: "straighten", action: go("measurement", "/measurement") },
    { id: "boq", label: "Go to BOQ", shortcut: "Ctrl+4", icon: "request_quote", action: go("boq", "/boq") },
    { id: "rates", label: "Go to Rate Analysis", shortcut: "Ctrl+5", icon: "analytics", action: go("rates", "/rates") },
    { id: "mat", label: "Go to Materials", shortcut: "Ctrl+6", icon: "inventory_2", action: go("materials", "/materials") },
    { id: "lab", label: "Go to Labour", shortcut: "Ctrl+7", icon: "engineering", action: go("labour", "/labour") },
    { id: "rep", label: "Go to Reports", shortcut: "Ctrl+8", icon: "description", action: go("reports", "/reports") },
    { id: "sett", label: "Go to Settings", shortcut: "Ctrl+9", icon: "settings", action: () => navigate("/settings") },
    { id: "new-proj", label: "Create New Project", icon: "add", action: () => navigate("/create-project") },
    { id: "toggle-theme", label: "Toggle Dark Mode", shortcut: "Ctrl+Shift+D", icon: "dark_mode", action: toggleDarkMode },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.icon.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = filtered[selectedIndex];
        if (item) {
          item.action();
          setOpen(false);
          setQuery("");
        }
      }
    },
    [filtered, selectedIndex]
  );

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-xl bg-bg-surface border border-border-default rounded-xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-default">
          <span className="material-symbols-outlined text-text-muted">search</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, actions, projects..."
            className="flex-1 bg-transparent text-text-primary font-body text-body outline-none placeholder:text-text-muted"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 bg-bg-elevated rounded text-text-muted font-mono text-mono text-[10px]">
            ESC
          </kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-text-muted font-body text-body">
              No results found for "{query}"
            </div>
          )}
          {filtered.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => {
                item.action();
                setOpen(false);
                setQuery("");
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                idx === selectedIndex
                  ? "bg-accent-primary-glow text-text-primary"
                  : "text-text-secondary hover:bg-bg-hover"
              }`}
              onMouseEnter={() => setSelectedIndex(idx)}
            >
              <span className="material-symbols-outlined text-[20px] text-text-muted">{item.icon}</span>
              <span className="flex-1 font-body text-body">{item.label}</span>
              {item.shortcut && (
                <kbd className="hidden sm:inline-block px-2 py-0.5 bg-bg-elevated border border-border-default rounded text-text-muted font-mono text-mono text-[10px]">
                  {item.shortcut}
                </kbd>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
