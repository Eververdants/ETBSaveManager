import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeroSection } from "@/components/hero-section";
import { site } from "@/content/site-content";

describe("HeroSection", () => {
  it("renders the site name in an accessible heading", () => {
    render(<HeroSection />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(site.name);
  });

  it("renders the tagline", () => {
    render(<HeroSection />);
    expect(screen.getByText(site.tagline)).toBeInTheDocument();
  });

  it("exposes a primary Download CTA pointing at releases/latest", () => {
    render(<HeroSection />);
    const cta = screen.getByRole("link", { name: /download for windows/i });
    expect(cta).toHaveAttribute("href", site.releasesUrl);
  });

  it("exposes a secondary GitHub CTA", () => {
    render(<HeroSection />);
    const cta = screen.getByRole("link", { name: /view on github/i });
    expect(cta).toHaveAttribute("href", site.githubUrl);
  });
});
