/**
 * 撤销 / 重做 Store — 模块级单例（对应 master 的 useUndoRedo）
 *
 * 保存可逆操作（软删除、可见性切换）的历史；
 * undo 只在操作提供 redo 时进入重做栈。
 */
import { create } from "zustand";
import type { UndoAction } from "../types";

interface HistoryAction extends UndoAction {
  id: string;
  timestamp: number;
}

const MAX_HISTORY = 50;

interface HistoryState {
  past: HistoryAction[];
  future: HistoryAction[];
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushAction: (action: UndoAction) => string;
  undo: () => Promise<string | null>;
  undoById: (id: string) => Promise<string | null>;
  redo: () => Promise<string | null>;
  lastActionDescription: () => string | null;
  clear: () => void;
}

function makeId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  past: [],
  future: [],

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  pushAction: (action) => {
    const entry: HistoryAction = { ...action, id: makeId(), timestamp: Date.now() };
    set((state) => ({
      past: [...state.past, entry].slice(-MAX_HISTORY),
      future: [],
    }));
    return entry.id;
  },

  undo: async () => {
    const { past } = get();
    if (past.length === 0) return null;
    const action = past[past.length - 1];
    set((state) => ({ past: state.past.slice(0, -1) }));
    try {
      await action.undo();
      if (action.redo) {
        set((state) => ({ future: [...state.future, action] }));
      }
      return action.id;
    } catch (error) {
      // 失败则放回，保持历史一致
      set((state) => ({ past: [...state.past, action] }));
      throw error;
    }
  },

  undoById: async (id) => {
    const { past } = get();
    const index = past.findIndex((a) => a.id === id);
    if (index === -1) return null;
    const action = past[index];
    set((state) => ({ past: state.past.filter((a) => a.id !== id) }));
    try {
      await action.undo();
      if (action.redo) {
        set((state) => ({ future: [...state.future, action] }));
      }
      return action.id;
    } catch (error) {
      set((state) => {
        const next = [...state.past];
        next.splice(index, 0, action);
        return { past: next };
      });
      throw error;
    }
  },

  redo: async () => {
    const { future } = get();
    if (future.length === 0) return null;
    const action = future[future.length - 1];
    set((state) => ({ future: state.future.slice(0, -1) }));
    try {
      await action.redo?.();
      set((state) => ({ past: [...state.past, action] }));
      return action.id;
    } catch (error) {
      set((state) => ({ future: [...state.future, action] }));
      throw error;
    }
  },

  lastActionDescription: () => {
    const { past } = get();
    return past.length > 0 ? past[past.length - 1].description : null;
  },

  clear: () => set({ past: [], future: [] }),
}));
