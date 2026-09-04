/**
 * 撤销 / 重做快捷键（Ctrl+Z / Ctrl+Shift+Z，macOS 用 Cmd）
 *
 * 返回注册函数，由调用方在 effect 中挂载并取消耗函数。
 */
import { useCallback } from "react";

import { useHistoryStore } from "../../../stores";

export function useUndoShortcuts() {
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const canUndo = useHistoryStore((s) => s.past.length > 0);
  const canRedo = useHistoryStore((s) => s.future.length > 0);

  const registerUndoShortcuts = useCallback(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        const state = useHistoryStore.getState();
        if (e.shiftKey) void state.redo();
        else void state.undo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { registerUndoShortcuts, undo, redo, canUndo, canRedo };
}
