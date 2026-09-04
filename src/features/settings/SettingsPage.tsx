/**
 * 设置页（master Settings + About → /settings）
 * 分区：外观 → 高级 → 系统更新 → 开发者（仅 developerMode）→ 关于
 * 各分区自带状态，本文件只做编排
 */
import AppearanceSection from "./components/AppearanceSection";
import AdvancedSection from "./components/AdvancedSection";
import UpdateSection from "./components/UpdateSection";
import DeveloperSection from "./components/DeveloperSection";
import AboutSection from "./components/AboutSection";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <AppearanceSection />
      <AdvancedSection />
      <UpdateSection />
      <DeveloperSection />
      <AboutSection />
    </div>
  );
}
