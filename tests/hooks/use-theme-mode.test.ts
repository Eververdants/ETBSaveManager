import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useThemeMode } from "@/hooks/use-theme-mode";

const STORAGE_KEY = "etb-theme-pref";

describe("useThemeMode", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("defaults to system when no preference stored", () => {
    const { result } = renderHook(() => useThemeMode());
    expect(result.current.preference).toBe("system");
    expect(result.current.isDark).toBe(false);
  });

  it("reflects dark system preference when preference is system", () => {
    window.matchMedia = (query: string) =>
      ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList;

    const { result } = renderHook(() => useThemeMode());
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("setPreference('dark') toggles dark class and persists", () => {
    const { result } = renderHook(() => useThemeMode());

    act(() => {
      result.current.setPreference("dark");
    });

    expect(result.current.preference).toBe("dark");
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("dark");
  });

  it("setPreference('light') removes dark class and persists", () => {
    const { result } = renderHook(() => useThemeMode());

    act(() => {
      result.current.setPreference("light");
    });

    expect(result.current.isDark).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("light");
  });

  it("reads an existing stored preference on init", () => {
    window.localStorage.setItem(STORAGE_KEY, "dark");
    const { result } = renderHook(() => useThemeMode());
    expect(result.current.preference).toBe("dark");
    expect(result.current.isDark).toBe(true);
  });
});
