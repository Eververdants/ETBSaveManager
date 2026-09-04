/**
 * 系统更新 —— 每日静默检查 + 手动检查
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, RefreshCw } from "lucide-react";

import { Button, Card, CardTitle, CardDescription } from "../../../components/ui";
import { toast } from "../../../stores";
import { updateService } from "../../../services/updateService";
import { APP_VERSION } from "../../../constants";
import { SectionHeader } from "./SettingsSection";

export default function UpdateSection() {
  const { t } = useTranslation();
  const [checking, setChecking] = useState(false);

  // 每日静默检查更新
  useEffect(() => {
    if (!updateService.canCheckUpdate()) return;
    void updateService
      .checkForUpdates()
      .then((info) => {
        updateService.recordLastCheck();
        if ("shouldUpdate" in info && info.shouldUpdate) {
          notifyUpdateAvailable(8000);
        }
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkForUpdates = async () => {
    setChecking(true);
    try {
      const info = await updateService.checkForUpdates();
      updateService.recordLastCheck();
      if ("shouldUpdate" in info && info.shouldUpdate) {
        notifyUpdateAvailable();
      } else {
        toast.success(t("settings.latestVersion"));
      }
    } catch {
      toast.error(t("settings.checkUpdateError", { error: "" }));
    } finally {
      setChecking(false);
    }
  };

  function notifyUpdateAvailable(duration?: number) {
    toast.info(t("settings.updateAvailable"), {
      ...(duration ? { duration } : {}),
      actions: [
        {
          text: t("settings.goToDownload"),
          onClick: () => void updateService.downloadAndInstall(),
        },
      ],
    });
  }

  return (
    <section className="space-y-3">
      <SectionHeader icon={<RefreshCw size={15} />} title={t("settings.systemAndUpdates")} />
      <Card className="flex items-center justify-between p-4">
        <div>
          <CardTitle>{t("settings.checkUpdatesDescription")}</CardTitle>
          <CardDescription className="mt-1">
            {t("common.versionLabel")} v{APP_VERSION}
          </CardDescription>
        </div>
        <Button
          size="sm"
          variant="secondary"
          loading={checking}
          onClick={() => void checkForUpdates()}
          icon={<Download size={13} />}
        >
          {t("settings.check")}
        </Button>
      </Card>
    </section>
  );
}
