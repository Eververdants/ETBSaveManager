import { describe, it, expect, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { DEFAULT_LANGUAGE, LANGUAGE_META, SUPPORTED_LANGUAGES, STORAGE_KEY } from "@/i18n";

describe("i18n", () => {
  beforeEach(() => {
    localStorage.setItem(STORAGE_KEY, DEFAULT_LANGUAGE);
  });

  it("exposes 3 supported languages", () => {
    expect(SUPPORTED_LANGUAGES).toEqual(["en-US", "zh-CN", "zh-TW"]);
  });

  it("exposes a label and htmlLang per language", () => {
    expect(LANGUAGE_META["en-US"].htmlLang).toBe("en");
    expect(LANGUAGE_META["zh-CN"].htmlLang).toBe("zh-Hans");
    expect(LANGUAGE_META["zh-TW"].htmlLang).toBe("zh-Hant");
  });

  it("renders a language switcher with 3 buttons (desktop)", () => {
    render(<LanguageSwitcher />);
    // desktop segment buttons hidden by `sm:flex`，用 aria-label 查
    SUPPORTED_LANGUAGES.forEach((lng) => {
      expect(screen.getByRole("button", { name: new RegExp(LANGUAGE_META[lng].label, "i") })).toBeInTheDocument();
    });
  });

  it("persists the chosen language into localStorage and updates <html lang>", () => {
    render(<LanguageSwitcher />);
    const zhCnButton = screen.getByRole("button", { name: new RegExp(LANGUAGE_META["zh-CN"].label, "i") });
    act(() => {
      zhCnButton.click();
    });
    expect(localStorage.getItem(STORAGE_KEY)).toBe("zh-CN");
    expect(document.documentElement.lang).toBe(LANGUAGE_META["zh-CN"].htmlLang);
  });
});
