import { useLenis } from "@/hooks/use-lenis";
import { useMousePosition } from "@/hooks/use-mouse-position";
import { NavBar } from "@/components/nav-bar";
import { HeroSection } from "@/components/hero-section";
import { FeaturesSection } from "@/components/features-section";
import { ScreensSection } from "@/components/screens-section";
import { DownloadSection } from "@/components/download-section";
import { FooterSection } from "@/components/footer-section";
import { MetadataStrip } from "@/components/metadata-strip";

export function App(): React.JSX.Element {
  useLenis();
  const mouse = useMousePosition();

  return (
    <div className="relative flex min-h-screen flex-col text-[var(--color-ink)] dark:text-[var(--color-paper)]">
      {/* 装饰：天花板瓷砖网格背景 */}
      <div aria-hidden="true" className="tile-grid pointer-events-none absolute inset-x-0 top-0 z-0 h-[680px]" />
      {/* 装饰：黄色光晕（hero 区域，随鼠标偏移） */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[120px] z-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-30 blur-3xl transition-transform duration-500 ease-out"
        style={{
          background: "radial-gradient(closest-side, var(--color-accent), transparent 70%)",
          transform: `translate(calc(-50% + ${mouse.x * 12}px), ${mouse.y * 8}px)`,
        }}
      />
      <MetadataStrip />
      <NavBar />
      <main className="relative z-10 flex-1">
        <HeroSection />
        <FeaturesSection />
        <ScreensSection />
        <DownloadSection />
      </main>
      <FooterSection />
    </div>
  );
}
