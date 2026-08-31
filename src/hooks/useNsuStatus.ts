/**
 * NSU (Nightmare Save Unlocker) 安装状态探测（对应 master useNsuStatus）
 *
 * 读取模组页保存的游戏根目录，查询 NSU 安装与启用状态，
 * 供难度选择器决定是否显示"难度修改需要 NSU"提示。
 */
import { useCallback, useState } from "react";

import { modsApi } from "../api";
import { GAME_ROOT_KEY } from "../api/mods";
import { storage } from "../utils/storage";

export function useNsuStatus() {
  /** 仅当 NSU 已安装且已启用时为 true —— 否则游戏无法识别难度修改 */
  const [nsuActive, setNsuActive] = useState(false);
  /** 首次探测完成前不渲染提示，避免已安装用户的闪烁 */
  const [nsuProbed, setNsuProbed] = useState(false);

  const refreshNsuStatus = useCallback(async () => {
    try {
      let gameRoot = storage.getItem<string>(GAME_ROOT_KEY) || "";
      // 模组页从未保存过路径时兜底：探测 Steam 库中的游戏安装目录
      if (!gameRoot) {
        gameRoot = (await modsApi.detectGamePath()) || "";
      }
      if (!gameRoot) {
        setNsuActive(false);
        return;
      }
      const status = await modsApi.getModsStatus(gameRoot);
      setNsuActive(status.nsu_installed && status.nsu_enabled);
    } catch (error) {
      console.warn("Failed to read NSU status:", error);
      setNsuActive(false);
    } finally {
      setNsuProbed(true);
    }
  }, []);

  return { nsuActive, nsuProbed, refreshNsuStatus };
}
