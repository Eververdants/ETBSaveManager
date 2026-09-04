/**
 * 高级设置（GPU 加速）
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal } from "lucide-react";

import { Card, Switch } from "../../../components/ui";
import { IS_TAURI, systemApi } from "../../../api";
import { toast } from "../../../stores";
import { SectionHeader } from "./SettingsSection";

export default function AdvancedSection() {
  const { t } = useTranslation();
  const [gpuDisabled, setGpuDisabled] = useState(false);

  // 同步 GPU 状态
  useEffect(() => {
    if (!IS_TAURI) return;
    void systemApi.getGpuAccelerationStatus().then(setGpuDisabled).catch(() => undefined);
  }, []);

  const handleGpuToggle = async (disabled: boolean) => {
    setGpuDisabled(disabled);
    try {
      await systemApi.setGpuAcceleration(disabled);
      toast.info(t("settings.gpuAccelerationChangedNeedRestart"));
    } catch {
      setGpuDisabled(!disabled);
      toast.error(t("common.error"));
    }
  };

  return (
    <section className="space-y-3">
      <SectionHeader icon={<SlidersHorizontal size={15} />} title={t("settings.advancedSettings")} />
      <Card className="p-4">
        <Switch
          checked={gpuDisabled}
          onChange={(v) => void handleGpuToggle(v)}
          label={t("settings.disableGpuAcceleration")}
          description={t("settings.disableGpuAccelerationDescription")}
        />
      </Card>
    </section>
  );
}
