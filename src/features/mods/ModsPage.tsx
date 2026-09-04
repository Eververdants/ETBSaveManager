/**
 * 模组管理页（master Mods → /mods/installed）
 * 游戏路径选择/校验 + UE4SS / NSU 安装管理 + 安装进度事件
 *
 * 本页只负责 UI 编排；业务逻辑与 Tauri 插件入口封装在 hooks/useMods.ts。
 */
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  CircleAlert,
  Download,
  ExternalLink,
  FolderOpen,
  FolderSearch,
  Package,
  PackageX,
  XCircle,
} from "lucide-react";

import { Badge, Button, Card, CardTitle, CardDescription, Switch } from "../../components/ui";
import { modsApi } from "../../api";
import type { ModsStatus } from "../../types";
import { useMods } from "./hooks/useMods";

const UE4SS_GITHUB = "https://github.com/UE4SS-RE/RE-UE4SS";

export default function ModsPage() {
  const { t } = useTranslation();
  const mods = useMods();

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-5">
      {/* 游戏路径 */}
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{t("mods.gamePath.title")}</CardTitle>
            <CardDescription className="mt-1">
              {mods.gameRoot || t("mods.gamePath.notSet")}
            </CardDescription>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={<FolderSearch size={13} />}
              onClick={() => void mods.chooseFolder()}
            >
              {t("mods.gamePath.choose")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={<FolderOpen size={13} />}
              disabled={!mods.win64Dir}
              onClick={() => void modsApi.openModsFolder()}
            >
              {t("mods.gamePath.openFolder")}
            </Button>
          </div>
        </div>
        {mods.pathValid === false && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--color-danger-subtle)] px-3 py-2 text-xs text-[var(--color-danger)]">
            <XCircle size={13} className="shrink-0" />
            {mods.reasonText(mods.pathReason)}
          </div>
        )}
        {mods.pathValid && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-success)]">
            <CheckCircle2 size={13} />
            {t("mods.gamePath.validShort")}
          </div>
        )}
      </Card>

      {/* 安装进度 */}
      {mods.progress && (
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-[var(--color-text-primary)]">
              {t("mods.progress.installing")} · {t(`mods.progress.${mods.progress.phase}`)}
            </span>
            <span className="tabular-nums text-[var(--color-text-muted)]">
              {Math.round(mods.progress.percent)}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-muted)]">
            <div
              className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-300"
              style={{ width: `${mods.progress.percent}%` }}
            />
          </div>
        </Card>
      )}

      {/* UE4SS */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[var(--color-primary-subtle)] p-2 text-[var(--color-primary)]">
              <Package size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>UE4SS</CardTitle>
                <Ue4ssBadge status={mods.status} />
              </div>
              <CardDescription className="mt-1">{t("mods.ue4ss.desc")}</CardDescription>
              <a
                href={UE4SS_GITHUB}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-xs text-[var(--color-text-link)] hover:underline"
              >
                GitHub <ExternalLink size={11} />
              </a>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {mods.status?.ue4ss_installed ? (
              <Button
                size="sm"
                variant="danger"
                loading={mods.busy === "ue4ss-rm"}
                icon={<PackageX size={13} />}
                onClick={() => void mods.uninstallUe4ss()}
              >
                {t("mods.common.uninstall")}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  loading={mods.busy === "ue4ss"}
                  onClick={() => void mods.installUe4ss("recommended")}
                >
                  {t("mods.ue4ss.installRecommended")}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={mods.busy === "ue4ss"}
                  onClick={() => void mods.installUe4ss("latest")}
                >
                  {t("mods.ue4ss.installLatest")}
                </Button>
              </div>
            )}
            {mods.status?.ue4ss_installed && mods.status.ue4ss_version && (
              <span className="text-[11px] text-[var(--color-text-muted)]">
                v{mods.status.ue4ss_version}
              </span>
            )}
          </div>
        </div>

        {/* 卸载提示：依赖它的第三方模组会被一并移除 */}
        {mods.status?.ue4ss_installed && mods.status.dependent_mods.length > 0 && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
            <CircleAlert size={13} className="mt-0.5 shrink-0 text-[var(--color-danger)]" />
            {t("mods.ue4ss.uninstallDependentsPrefix")} {mods.status.dependent_mods.join(", ")}
          </div>
        )}
      </Card>

      {/* NSU */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[var(--color-primary-subtle)] p-2 text-[var(--color-primary)]">
              <Package size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>{t("mods.nsu.name")}</CardTitle>
                {mods.status?.nsu_installed ? (
                  <Badge tone={mods.nsuEnabled ? "success" : "neutral"}>
                    {mods.nsuEnabled
                      ? t("mods.status.installed")
                      : t("mods.status.installedDisabled")}
                  </Badge>
                ) : (
                  <Badge>{t("mods.status.notInstalled")}</Badge>
                )}
              </div>
              <CardDescription className="mt-1">{t("mods.nsu.desc")}</CardDescription>
              {mods.status?.nsu_installed && !mods.status.ue4ss_installed && (
                <p className="mt-1.5 text-xs text-[var(--color-danger)]">
                  {t("mods.nsu.requiresUe4ss")}
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center">
            {mods.status?.nsu_installed ? (
              <Button
                size="sm"
                variant="danger"
                loading={mods.busy === "nsu-rm"}
                icon={<PackageX size={13} />}
                onClick={() => void mods.uninstallNsu()}
              >
                {t("mods.common.uninstall")}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                loading={mods.busy === "nsu"}
                disabled={!!mods.status && !mods.status.ue4ss_installed}
                icon={<Download size={13} />}
                onClick={() => void mods.installNsu()}
              >
                {t("mods.nsu.install")}
              </Button>
            )}
          </div>
        </div>
        {mods.status?.nsu_installed && (
          <div className="mt-3">
            <Switch
              checked={mods.nsuEnabled}
              onChange={(v) => void mods.toggleNsu(v)}
              label={t("mods.nsu.enabled")}
              description={t("mods.nsu.enableDesc")}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

function Ue4ssBadge({ status }: { status: ModsStatus | null }) {
  const { t } = useTranslation();
  if (!status?.ue4ss_installed) return <Badge>{t("mods.status.notInstalled")}</Badge>;
  if (status.ue4ss_managed) {
    return (
      <Badge tone="success">
        {t("mods.status.installed")}
        {status.ue4ss_channel
          ? ` · ${t(`mods.ue4ss.channel${status.ue4ss_channel === "recommended" ? "Recommended" : "Latest"}`)}`
          : ""}
      </Badge>
    );
  }
  return <Badge tone="warning">{t("mods.status.detectedUnmanaged")}</Badge>;
}
