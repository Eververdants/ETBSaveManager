/**
 * 外观与语言设置
 */
import { useTranslation } from "react-i18next";
import { Palette } from "lucide-react";

import { Card, Dropdown } from "../../../components/ui";
import { IS_TAURI, systemApi } from "../../../api";
import { useAppStore } from "../../../stores";
import { supportedLanguages } from "../../../locales";
import i18n from "../../../locales";
import { toast } from "../../../stores";
import { SectionHeader, SettingsRow } from "./SettingsSection";
import ThemeSelector from "./ThemeSelector";

export default function AppearanceSection() {
  const { t } = useTranslation();
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  const handleTheme = (value: string) => {
    const next = value as "light" | "dark" | "system";
    setTheme(next);
    if (IS_TAURI) {
      void systemApi
        .setWindowTitle(`${t("common.appName")} — ${t(`common.${next}`)}`)
        .catch(() => undefined);
    }
  };

  const handleLanguage = async (value: string) => {
    const prev = i18n.language;
    try {
      await i18n.changeLanguage(value);
      if (IS_TAURI) {
        await systemApi.setWindowTitle(t("common.appName"));
      }
    } catch {
      // 失败回滚
      await i18n.changeLanguage(prev);
      toast.error(t("common.error"));
    }
  };

  return (
    <section className="space-y-3">
      <SectionHeader icon={<Palette size={15} />} title={t("settings.appearanceAndLanguage")} />
      <Card className="divide-y divide-[var(--color-border-light)]">
        <div className="p-4">
          <SettingsRow
            label={t("settings.theme")}
            description={t("settings.themeDescription")}
            control={<ThemeSelector value={theme} onChange={handleTheme} />}
          />
        </div>
        <div className="p-4">
          <SettingsRow
            label={t("settings.language")}
            control={
              <Dropdown
                className="w-44"
                value={i18n.language}
                onChange={(v) => void handleLanguage(v)}
                options={supportedLanguages.map((l) => ({ value: l.code, label: l.nativeName }))}
              />
            }
          />
        </div>
      </Card>
    </section>
  );
}
