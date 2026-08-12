/**
 * 物品名称 ↔ id 映射（与后端 save_shared.rs 的 ITEM_MAP 保持一致）
 *
 * 存档里物品存英文名（NameProperty），前后端以 id 中转：
 * 前端 name → id → 后端 id → name 写入存档。
 * 两边映射必须一致，否则物品会被悄悄替换成别的。
 */

/** 物品英文名 → id（与后端 ITEM_MAP 一一对应） */
export const ITEM_ID_BY_NAME: Record<string, number> = {
  AlmondConcentrate: 1,
  BugSpray: 2,
  Camera: 3,
  AlmondWater: 4,
  Chainsaw: 5,
  DivingHelmet: 6,
  EnergyBar: 7,
  Firework: 8,
  Flaregun: 9,
  Flashlight: 10,
  GlowstickBlue: 11,
  GlowStick: 12,
  GlowstickRed: 13,
  GlowstickYellow: 14,
  Juice: 15,
  LiquidPain: 16,
  Rope: 17,
  LiDAR: 18,
  Thermometer: 19,
  Ticket: 20,
  WalkieTalkie: 21,
  MothJelly: 22,
  Crowbar: 23,
  Knife: 24,
  Toy: 25,
};

/**
 * 物品英文名 → id。空/None/未知物品返回 -1（后端映射为 "None"）。
 */
export function getItemIdByName(itemName?: string | null): number {
  if (!itemName || itemName === "None") return -1;
  return ITEM_ID_BY_NAME[itemName] ?? -1;
}
