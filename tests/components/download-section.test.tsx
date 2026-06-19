import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DownloadSection } from "@/components/download-section";
import { site } from "@/content/site-content";

describe("DownloadSection", () => {
  it("renders a Download heading", () => {
    render(<DownloadSection />);
    expect(screen.getByRole("heading", { name: /download/i })).toBeInTheDocument();
  });

  it("renders one button per download entry pointing at releases/latest", () => {
    render(<DownloadSection />);
    const links = screen.getAllByRole("link");
    const downloadLinks = links.filter((link) =>
      site.downloads.some((d) => d.label === link.textContent?.trim()),
    );
    expect(downloadLinks).toHaveLength(site.downloads.length);
    downloadLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", site.releasesUrl);
    });
  });
});
