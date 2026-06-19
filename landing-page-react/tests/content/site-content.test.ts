import { describe, it, expect } from "vitest";
import { site } from "@/content/site-content";

describe("site-content", () => {
  it("exposes non-empty name and tagline", () => {
    expect(site.name.length).toBeGreaterThan(0);
    expect(site.tagline.length).toBeGreaterThan(0);
    expect(site.description.length).toBeGreaterThan(0);
  });

  it("lists 6 features, each with id/title/description/iconKey", () => {
    expect(site.features).toHaveLength(6);
    site.features.forEach((feature) => {
      expect(feature.id.length).toBeGreaterThan(0);
      expect(feature.title.length).toBeGreaterThan(0);
      expect(feature.description.length).toBeGreaterThan(0);
      expect(feature.iconKey.length).toBeGreaterThan(0);
    });
  });

  it("lists 3 Windows download entries pointing at the GitHub releases latest", () => {
    expect(site.downloads).toHaveLength(3);
    site.downloads.forEach((download) => {
      expect(download.id.length).toBeGreaterThan(0);
      expect(download.label.length).toBeGreaterThan(0);
      expect(download.href).toBe(site.releasesUrl);
    });
  });

  it("uses HTTPS URLs for github/releases", () => {
    expect(site.githubUrl.startsWith("https://")).toBe(true);
    expect(site.releasesUrl.startsWith("https://")).toBe(true);
  });
});
