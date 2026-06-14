// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock canvas for getTextWidth
const mockMeasureText = vi.fn((text: string) => ({ width: text.length * 8 }));
const mockGetContext = vi.fn(() => ({
  measureText: mockMeasureText,
  font: "",
}));
const originalCreateElement = document.createElement.bind(document);
document.createElement = ((tag: string) => {
  if (tag === "canvas") {
    return { getContext: mockGetContext } as unknown as HTMLCanvasElement;
  }
  return originalCreateElement(tag);
}) as typeof document.createElement;

import { useArchiveCardStyle, markInitialLoadComplete, resetInitialLoad } from "../useArchiveCard";

describe("useArchiveCardStyle", () => {
  let style: ReturnType<typeof useArchiveCardStyle>;

  beforeEach(() => {
    mockMeasureText.mockClear();
    mockGetContext.mockClear();
    style = useArchiveCardStyle();
  });

  describe("tagStyle", () => {
    it("returns CSS custom properties for tag width", () => {
      const result = style.tagStyle("Easy", "Difficulty");
      expect(result).toHaveProperty("--w-short");
      expect(result).toHaveProperty("--w-full");
    });

    it("short width is always at least 30px", () => {
      const result = style.tagStyle("", "");
      const shortWidth = parseInt(result["--w-short"]);
      expect(shortWidth).toBeGreaterThanOrEqual(30);
    });

    it("full width is at least as wide as short width", () => {
      const result = style.tagStyle("Normal", "Diff");
      const shortWidth = parseInt(result["--w-short"]);
      const fullWidth = parseInt(result["--w-full"]);
      expect(fullWidth).toBeGreaterThanOrEqual(shortWidth);
    });

    it("widths are valid pixel values", () => {
      const result = style.tagStyle("Hard", "ArchiveDifficulty");
      expect(result["--w-short"]).toMatch(/^\d+px$/);
      expect(result["--w-full"]).toMatch(/^\d+px$/);
    });

    it("longer text produces wider tags", () => {
      const short = style.tagStyle("A", "P");
      const long = style.tagStyle("Nightmare", "ArchiveDifficulty");
      const shortWidth = parseInt(short["--w-full"]);
      const longWidth = parseInt(long["--w-full"]);
      expect(longWidth).toBeGreaterThan(shortWidth);
    });
  });
});

describe("markInitialLoadComplete and resetInitialLoad", () => {
  it("exports the functions from useArchiveCard", () => {
    expect(typeof markInitialLoadComplete).toBe("function");
    expect(typeof resetInitialLoad).toBe("function");
  });

  it("markInitialLoadComplete can be called without error", () => {
    expect(() => markInitialLoadComplete()).not.toThrow();
  });

  it("resetInitialLoad can be called without error", () => {
    expect(() => resetInitialLoad()).not.toThrow();
  });
});
