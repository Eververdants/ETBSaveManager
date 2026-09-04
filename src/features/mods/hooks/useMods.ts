/**
 * 模组管理 Hook — 组合入口
 *
 * 页面只需 useMods()：
 * - 路径校验与状态刷新 → useModsGamePath
 * - UE4SS / NSU 安装卸载与进度 → useModsInstall
 * Tauri 的 event / dialog 插件入口按模块边界要求封装在上述 hook 内。
 */
import { useModsGamePath } from "./useModsGamePath";
import { useModsInstall } from "./useModsInstall";

export type { ModProgress } from "./useModsInstall";

export function useMods() {
  const {
    gameRoot,
    pathValid,
    pathReason,
    win64Dir,
    status,
    nsuEnabled,
    setNsuEnabled,
    refreshStatus,
    chooseFolder,
    reasonText,
  } = useModsGamePath();

  const { busy, progress, installUe4ss, uninstallUe4ss, installNsu, uninstallNsu, toggleNsu } =
    useModsInstall({
      gameRoot,
      pathValid,
      status,
      nsuEnabled,
      setNsuEnabled,
      refreshStatus,
    });

  return {
    gameRoot,
    pathValid,
    pathReason,
    win64Dir,
    status,
    nsuEnabled,
    busy,
    progress,
    reasonText,
    chooseFolder,
    installUe4ss,
    uninstallUe4ss,
    installNsu,
    uninstallNsu,
    toggleNsu,
  };
}
