import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FooterSection } from "@/components/footer-section";
import { site } from "@/content/site-content";

describe("FooterSection", () => {
  it("renders the site name", () => {
    render(<FooterSection />);
    // footer 巨型品牌署名是 "E·T·B" 拼接（en-US），site.name 不会直接出现
    // —— 改为按"档案版"戳定位
    expect(screen.getByText(/archive ed\./i)).toBeInTheDocument();
  });

  it("exposes a License link pointing at the repository LICENSE file", () => {
    render(<FooterSection />);
    const link = screen.getByRole("link", { name: /license/i });
    expect(link).toHaveAttribute("href", `${site.githubUrl}/blob/main/LICENSE`);
  });

  it("exposes a Releases link", () => {
    render(<FooterSection />);
    const link = screen.getByRole("link", { name: /releases/i });
    expect(link).toHaveAttribute("href", site.releasesUrl);
  });

  it("renders a copyright line with the current year", () => {
    render(<FooterSection />);
    const year = new Date().getFullYear();
    // 版权行 © {year} ETB Save Manager. released under mit.
    expect(screen.getByText(new RegExp(`©\\s*${year}`))).toBeInTheDocument();
  });
});
