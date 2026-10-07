import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FaqSection } from "@/components/faq-section";

describe("FaqSection", () => {
  it("renders a questions/answers heading", () => {
    render(<FaqSection />);
    expect(screen.getByRole("heading", { name: /questions/i })).toBeInTheDocument();
  });

  it("renders six collapsible Q&A items", () => {
    const { container } = render(<FaqSection />);
    expect(container.querySelectorAll("details")).toHaveLength(6);
    expect(screen.getByText(/What is ETB Save Manager\?/i)).toBeInTheDocument();
    expect(screen.getByText(/What languages does the interface support\?/i)).toBeInTheDocument();
  });
});
