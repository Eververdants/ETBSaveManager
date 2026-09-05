/**
 * useUndoRedo - 操作历史栈 composable
 *
 * 提供撤销/重做能力，支持任意可逆操作。
 *
 * 用法：
 *   const { pushAction, undo, redo, canUndo, canRedo } = useUndoRedo()
 *   pushAction({
 *     description: '删除存档 xxx',
 *     undo: async () => { 恢复操作 },
 *     redo: async () => { 重新执行 },
 *   })
 *   Ctrl+Z -> undo()
 *   Ctrl+Shift+Z -> redo()
 */

import { ref, computed, type ComputedRef } from "vue";
import type { UndoAction } from "@/types";

interface HistoryAction extends UndoAction {
  id: string;
  timestamp: number;
}

const MAX_HISTORY = 50;

// Singleton state — shared across all consumers
const past = ref<HistoryAction[]>([]);
const future = ref<HistoryAction[]>([]);

export function useUndoRedo(): {
  canUndo: ComputedRef<boolean>;
  canRedo: ComputedRef<boolean>;
  pushAction: (action: UndoAction) => string;
  undo: () => Promise<string | null>;
  undoById: (id: string) => Promise<string | null>;
  redo: () => Promise<string | null>;
  lastActionDescription: () => string | null;
  clear: () => void;
} {
  const canUndo = computed((): boolean => past.value.length > 0);
  const canRedo = computed((): boolean => future.value.length > 0);

  /**
   * Push an undoable action onto the stack.
   */
  function pushAction(action: UndoAction): string {
    const id = Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    past.value.push({
      id,
      description: action.description,
      undo: action.undo,
      redo: action.redo || undefined,
      timestamp: Date.now(),
    });

    // Clear future on new action
    future.value.splice(0, future.value.length);

    // Trim history
    if (past.value.length > MAX_HISTORY) {
      past.value.shift();
    }

    return id;
  }

  /**
   * Undo the most recent action.
   * Returns the undone action's description, or null if nothing to undo.
   */
  async function undo(): Promise<string | null> {
    if (past.value.length === 0) return null;

    const action = past.value.pop()!;

    try {
      if (typeof action.undo === "function") {
        await action.undo();
      }
      // Push to redo stack (only if it has a redo function)
      if (typeof action.redo === "function") {
        future.value.push(action);
      }
      return action.description;
    } catch (error) {
      console.error("[useUndoRedo] Undo failed:", error);
      // Push back on failure
      past.value.push(action);
      throw error;
    }
  }

  /**
   * Undo a specific action by id (e.g. a delete-toast Undo button),
   * regardless of its position in the history stack.
   * Returns the undone action's description, or null if the id was not found.
   *
   * Clears the future (redo) stack because selectively undoing an action
   * invalidates the linear redo sequence — replaying future actions after
   * a non-linear undo would produce inconsistent state.
   */
  async function undoById(id: string): Promise<string | null> {
    const index = past.value.findIndex((a) => a.id === id);
    if (index === -1) return null;

    const [action] = past.value.splice(index, 1);

    try {
      if (typeof action.undo === "function") {
        await action.undo();
      }
      // Push to redo stack (only if it has a redo function)
      if (typeof action.redo === "function") {
        future.value.push(action);
      }
      // Future stack is now stale — clear it to prevent inconsistent redo
      future.value.splice(0, future.value.length);
      return action.description;
    } catch (error) {
      console.error("[useUndoRedo] Undo failed:", error);
      // Push back on failure
      past.value.splice(index, 0, action);
      throw error;
    }
  }

  /**
   * Redo the last undone action.
   * Returns the redone action's description, or null if nothing to redo.
   */
  async function redo(): Promise<string | null> {
    if (future.value.length === 0) return null;

    const action = future.value.pop()!;

    try {
      if (typeof action.redo === "function") {
        await action.redo();
      }
      past.value.push(action);
      return action.description;
    } catch (error) {
      console.error("[useUndoRedo] Redo failed:", error);
      future.value.push(action);
      throw error;
    }
  }

  /**
   * Get the most recent action description for display purposes.
   */
  function lastActionDescription(): string | null {
    if (past.value.length === 0) return null;
    return past.value[past.value.length - 1].description;
  }

  /**
   * Clear all history.
   *
   * WARNING: This is a GLOBAL operation. Because past/future are module-level
   * singletons shared across all consumers, calling clear() discards undo/redo
   * state for EVERY consumer — not just the caller. If you need per-consumer
   * isolation, namespace your stacks instead of using this singleton.
   */
  function clear(): void {
    past.value.splice(0, past.value.length);
    future.value.splice(0, future.value.length);
  }

  return {
    canUndo,
    canRedo,
    pushAction,
    undo,
    undoById,
    redo,
    lastActionDescription,
    clear,
  };
}
