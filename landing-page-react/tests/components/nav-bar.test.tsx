import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NavBar } from "@/components/nav-bar";
import { site } from "@/content/site-content";

describe("NavBar", () => {
  it("renders the site name as a brand link", () => {
    render(<NavBar />);
    const brand = screen.getByRole("link", { name: site.name });
    expect(brand).toBeInTheDocument();
  });

  it("exposes a GitHub link pointing at the project repository", () => {
    render(<NavBar />);
    const ghLink = screen.getByRole("link", { name: /github/i });
    expect(ghLink).toHaveAttribute("href", site.githubUrl);
  });

  it("renders the theme toggle", () => {
    render(<NavBar />);
    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument();
  });
});
