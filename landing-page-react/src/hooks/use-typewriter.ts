import { useEffect, useState } from "react";

export interface UseTypewriterResult {
  displayed: string;
  isDone: boolean;
}

/**
 * 打字机效果：逐字显示 text。
 * 当 startOn=false 时清空文字，用于与 IntersectionObserver 联动。
 */
export function useTypewriter(text: string, speed = 40, startOn = true): UseTypewriterResult {
  const [displayed, setDisplayed] = useState("");
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!startOn) {
      setDisplayed("");
      setIsDone(false);
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i <= text.length) {
        setDisplayed(text.slice(0, i));
      }
      if (i >= text.length) {
        clearInterval(interval);
        setIsDone(true);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, startOn]);

  return { displayed, isDone };
}
