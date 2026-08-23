/**
 * NSU (Nightmare Save Unlocker) 安装状态探测。
 *
 * 读取模组页面保存的游戏根目录，查询 NSU 的安装与启用状态，
 * 供编辑存档/创建存档页面决定是否显示难度修改提示。
 */
import { ref } from "vue";
import storageService from "../services/storageService";
import modService, { GAME_ROOT_KEY } from "../services/modService";

export function useNsuStatus() {
  /** 仅当 NSU 已安装且已启用时为 true —— 否则游戏无法识别难度修改。 */
  const nsuActive = ref(false);
  /** 首次探测是否已完成 —— 完成前不渲染提示，避免已安装用户的闪烁 */
  const nsuProbed = ref(false);

  const refreshNsuStatus = async () => {
    try {
      let gameRoot = storageService.getItem<string>(GAME_ROOT_KEY) || "";
      // 模组页从未保存过路径时兜底：探测 Steam 库中的游戏安装目录
      if (!gameRoot) {
        gameRoot = (await modService.detectGamePath()) || "";
      }
      if (!gameRoot) {
        nsuActive.value = false;
        return;
      }
      const status = await modService.getModsStatus(gameRoot);
      nsuActive.value = status.nsu_installed && status.nsu_enabled;
    } catch (error) {
      // 游戏目录无效或读取失败 —— NSU 必然未生效
      console.warn("Failed to read NSU status:", error);
      nsuActive.value = false;
    } finally {
      nsuProbed.value = true;
    }
  };

  return { nsuActive, nsuProbed, refreshNsuStatus };
}
