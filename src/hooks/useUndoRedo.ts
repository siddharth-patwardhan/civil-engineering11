import { useState, useCallback, useRef, useEffect } from "react";

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useUndoRedo<T>(initial: T, maxHistory = 50, syncKey?: string | number) {
  const [state, setState] = useState<UndoRedoState<T>>({
    past: [],
    present: initial,
    future: [],
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // Reset undo stack when external source changes (e.g. project switch / server pull)
  const syncRef = useRef(syncKey);
  useEffect(() => {
    if (syncKey === undefined) return;
    if (syncRef.current !== syncKey) {
      syncRef.current = syncKey;
      setState({ past: [], present: initial, future: [] });
    }
  }, [syncKey, initial]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setState((prev) => {
        const present = typeof next === "function" ? (next as (prev: T) => T)(prev.present) : next;
        if (present === prev.present) return prev;
        const past = [prev.present, ...prev.past].slice(0, maxHistory);
        return { past, present, future: [] };
      });
    },
    [maxHistory]
  );

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.past.length === 0) return prev;
      const [previous, ...newPast] = prev.past;
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.future.length === 0) return prev;
      const [next, ...newFuture] = prev.future;
      return {
        past: [prev.present, ...prev.past],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const reset = useCallback((value: T) => {
    setState({ past: [], present: value, future: [] });
  }, []);

  return {
    state: state.present,
    set,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
  };
}
