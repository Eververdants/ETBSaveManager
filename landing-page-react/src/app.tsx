import { NavBar } from "@/components/nav-bar";
import { HeroSection } from "@/components/hero-section";
import { FeaturesSection } from "@/components/features-section";
import { ScreensSection } from "@/components/screens-section";
import { DownloadSection } from "@/components/download-section";
import { FooterSection } from "@/components/footer-section";

export function App(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <NavBar />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <ScreensSection />
        <DownloadSection />
      </main>
      <FooterSection />
    </div>
  );
}
