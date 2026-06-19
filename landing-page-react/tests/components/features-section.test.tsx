import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeaturesSection } from "@/components/features-section";
import { site } from "@/content/site-content";

describe("FeaturesSection", () => {
  it("renders a Features heading", () => {
    render(<FeaturesSection />);
    expect(screen.getByRole("heading", { name: /features/i })).toBeInTheDocument();
  });

  it("renders one card per feature defined in site-content", () => {
    render(<FeaturesSection />);
    site.features.forEach((feature) => {
      expect(screen.getByText(feature.title)).toBeInTheDocument();
    });
  });
});
