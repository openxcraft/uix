import { useEffect, useSyncExternalStore } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { getState, store, subscribe } from "./data/store";
import { flushQueue, isApiMode } from "./data/api-client";
import { BoardsPage } from "./features/boards/BoardsPage";
import { BoardPage } from "./features/board/BoardPage";
import type { AppState } from "./domain/types";

export function useStore<T>(selector: (state: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getState()),
    () => selector(getState()),
  );
}

export function App() {
  useEffect(() => {
    if (!isApiMode()) return;
    void flushQueue();
    const timer = setInterval(() => void flushQueue(), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => store.fireDueEvents(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BoardsPage />} />
        <Route path="/boards/:boardId" element={<BoardPage />} />
        <Route path="/boards/:boardId/card/:cardId" element={<BoardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
