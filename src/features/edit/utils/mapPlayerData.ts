/**
 * 玩家数据映射 — 存档原始 PlayerData → 编辑页 EditPlayer 列表
 *
 * 纯数据转换，与 React 状态无关，便于独立测试。
 */
import { stripSteamIdSuffix } from "../../../utils/steamIdUtils";
import type { PlayerData } from "../../../types";
import type { EditPlayer } from "../types";

/** 背包槽位数（4×3） */
export const INVENTORY_SLOTS = 12;

/**
 * @param localPlayerSuffix 离线玩家显示名后缀（i18n，由调用方传入以保持本文件无 i18n 依赖）
 */
export function mapPlayerData(data: PlayerData, localPlayerSuffix: string): EditPlayer[] {
  if (!data?.ids || !data?.inventories) return [];

  const list: EditPlayer[] = [];

  data.ids.forEach((steamId, index) => {
    if (!steamId?.trim()) return;

    const inventory = (data.inventories[index] || []).map((item) => item || null);
    while (inventory.length < INVENTORY_SLOTS) inventory.push(null);

    let processedId: string;
    let isOffline = false;
    let username: string | null = null;

    if (steamId.includes("-")) {
      processedId = steamId.split("-")[0];
      isOffline = true;
      username = `${processedId}${localPlayerSuffix}`;
    } else {
      processedId = stripSteamIdSuffix(steamId);
    }

    list.push({
      steamId: processedId,
      originalSteamId: steamId,
      inventory: inventory.slice(0, INVENTORY_SLOTS),
      username,
      isOfflinePlayer: isOffline,
      sanity: data.sanities[index] ?? 100,
    });
  });

  return list;
}
