import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  // 清理 useThemeMode 在 localStorage 与 <html> 上留下的副作用
  window.localStorage.clear();
  document.documentElement.classList.remove("dark");
});
