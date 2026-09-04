/**
 * 自定义 Hooks — 跨模块共享
 * 所有自定义 Hook 必须以 'use' 开头
 *
 * 说明：此前本文件还导出了 useToggle / useDebounce / useLoading /
 * usePrevious / useMediaQuery，五个 hook 全局零引用（useLoading 是
 * stores/uiStore 的唯一消费者，连带让该 store 成为孤儿）。
 * 按 AGENTS.md「无死代码」要求一并移除，需要时再按真实需求新增。
 */
import { useEffect, useRef } from "react";

/**
 * useClickOutside - 点击外部检测
 */
export function useClickOutside<T extends HTMLElement>(
  callback: () => void
): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [callback]);

  return ref;
}
