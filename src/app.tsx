import { ReactLenis } from "lenis/react";
import { useMousePosition } from "@/hooks/use-mouse-position";
import { useParallax } from "@/hooks/use-parallax";
import { NavBar } from "@/components/nav-bar";
import { HeroSection } from "@/components/hero-section";
import { FeaturesSection } from "@/components/features-section";
import { ScreensSection } from "@/components/screens-section";
import { DownloadSection } from "@/components/download-section";
import { FooterSection } from "@/components/footer-section";
import { MetadataStrip } from "@/components/metadata-strip";

/**
 * 首屏开场幕布：档案盖章式的品牌瞬间，随后整块上移让出首屏。
 * 纯装饰（aria-hidden），约 1.7s 完成，尊重 reduced-motion（CSS 兜底）。
 */
function PageIntro(): React.JSX.Element | null {
  return (
    <div className="page-intro" aria-hidden="true">
      <div className="page-intro__inner">
        <div className="page-intro__frame">
          <span className="page-intro__monogram">E.T.B.</span>
        </div>
        <div className="page-intro__line" />
        <span className="page-intro__mono">etb save manager · declassifying</span>
      </div>
    </div>
  );
}

export function App(): React.JSX.Element {
  const mouse = useMousePosition();

  // 滚动视差装饰层：天花板网格（慢速远层）+ 黄色光晕（近层）
  const gridParallax = useParallax<HTMLDivElement>(0.14);
  const glowParallax = useParallax<HTMLDivElement>(-0.08);

  return (
    <ReactLenis
      root
      options={{
        duration: 1.0,
        // ease-out cubic: 开始快、结束慢，感觉自然
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.3,
        orientation: "vertical",
        gestureOrientation: "vertical",
        anchors: true,
        respectReducedMotion: true,
      }}
    >
      <PageIntro />
      <div className="relative flex min-h-screen flex-col text-[var(--color-ink)] dark:text-[var(--color-paper)]">
        {/* 装饰：天花板瓷砖网格背景（滚动视差 · 远层） */}
        <div ref={gridParallax} aria-hidden="true" className="parallax-layer pointer-events-none absolute inset-x-0 top-0 z-0 h-[680px]">
          <div className="tile-grid h-full w-full" />
        </div>
        {/* 装饰：黄色光晕（hero 区域，随鼠标偏移 + 滚动视差 · 近层） */}
        <div
          ref={glowParallax}
          aria-hidden="true"
          className="parallax-layer pointer-events-none absolute left-1/2 top-[120px] z-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-30 blur-3xl transition-transform duration-500 ease-out"
        >
          <div
            className="h-full w-full rounded-full"
            style={{
              background: "radial-gradient(closest-side, var(--color-accent), transparent 70%)",
              transform: `translate(${mouse.x * 12}px, ${mouse.y * 8}px)`,
            }}
          />
        </div>
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
    </ReactLenis>
  );
}
