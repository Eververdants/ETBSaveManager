import { describe, it, expect, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import i18next from "i18next";

import { HeroSection } from "@/components/hero-section";
import { STORAGE_KEY } from "@/i18n";

describe("i18n — component re-renders on language change", () => {
  beforeEach(() => {
    localStorage.setItem(STORAGE_KEY, "en-US");
  });

  it("renders the hero CTA in English by default", () => {
    render(<HeroSection />);
    expect(screen.getByRole("link", { name: /download for windows/i })).toBeInTheDocument();
  });

  it("switches the hero CTA to 简体中文 after changeLanguage", async () => {
    render(<HeroSection />);
    expect(screen.getByRole("link", { name: /download for windows/i })).toBeInTheDocument();

    await act(async () => {
      await i18next.changeLanguage("zh-CN");
    });

    expect(screen.getByRole("link", { name: /下载 Windows 版/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /download for windows/i })).toBeNull();
  });

  it("switches the hero CTA to 繁體中文 after changeLanguage", async () => {
    render(<HeroSection />);

    await act(async () => {
      await i18next.changeLanguage("zh-TW");
    });

    expect(screen.getByRole("link", { name: /下載 Windows 版/i })).toBeInTheDocument();
  });
});
