import { useEffect } from "react";

interface ShortcutMap {
  [key: string]: (e: KeyboardEvent) => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap, deps: import("react").DependencyList = []) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const key = [];
      if (e.ctrlKey || e.metaKey) key.push("ctrl");
      if (e.shiftKey) key.push("shift");
      if (e.altKey) key.push("alt");
      key.push(e.key.toLowerCase());
      const combo = key.join("+");
      if (shortcuts[combo]) {
        e.preventDefault();
        shortcuts[combo](e);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
