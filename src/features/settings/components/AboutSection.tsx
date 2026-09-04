/**
 * 关于 —— 应用信息 + 连点图标 5 次开启开发者模式的彩蛋
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, Info } from "lucide-react";

import { Badge, Card } from "../../../components/ui";
import { useAppStore } from "../../../stores";
import { toast } from "../../../stores";
import { APP_VERSION } from "../../../constants";
import { SectionHeader } from "./SettingsSection";

/** 连点判定窗口（毫秒）与所需次数 */
const EASTER_EGG_WINDOW = 1000;
const EASTER_EGG_CLICKS = 5;

export default function AboutSection() {
  const { t } = useTranslation();
  const setDeveloperMode = useAppStore((s) => s.setDeveloperMode);
  const [iconClicks, setIconClicks] = useState<number[]>([]);

  const handleIconClick = () => {
    const now = Date.now();
    const clicks = [...iconClicks, now].filter((ts) => now - ts < EASTER_EGG_WINDOW);
    setIconClicks(clicks);
    if (clicks.length >= EASTER_EGG_CLICKS) {
      setDeveloperMode(true);
      toast.success(t("about.developerModeActivated"));
      setIconClicks([]);
    }
  };

  return (
    <section className="space-y-3">
      <SectionHeader icon={<Info size={15} />} title={t("about.appInfo")} />
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleIconClick}
            className="h-14 w-14 overflow-hidden rounded-xl border border-[var(--color-border-light)]"
          >
            <img
              src="/icon.png"
              alt="ETBToolkit"
              className="h-full w-full object-contain"
              draggable={false}
            />
          </button>
          <div>
            <p className="flex items-center gap-2 text-base font-semibold text-[var(--color-text-primary)]">
              {t("common.appName")}
              <Badge tone="primary">v{APP_VERSION}</Badge>
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{t("about.tagline")}</p>
          </div>
          <a
            href="https://github.com/Eververdants/ETBSaveManager"
            target="_blank"
            rel="noreferrer"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]"
            aria-label="GitHub"
          >
            <ExternalLink size={17} />
          </a>
        </div>
      </Card>
    </section>
  );
}
