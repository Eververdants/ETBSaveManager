import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScreensSection } from "@/components/screens-section";

describe("ScreensSection", () => {
  it("renders the section heading", () => {
    render(<ScreensSection />);
    expect(screen.getByRole("heading", { name: /see it in action/i })).toBeInTheDocument();
  });

  it("renders exactly 3 abstract UI cards", () => {
    render(<ScreensSection />);
    const cards = screen.getAllByTestId("screen-card");
    expect(cards).toHaveLength(3);
  });
});
