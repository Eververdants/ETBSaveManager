/**
 * 关卡工具 — 图片路径与 i18n 显示名
 */
import { useTranslation } from "react-i18next";

/** 关卡 key → 缩略图路径 */
export function getLevelImage(levelKey: string): string {
  return `/images/ETB/${levelKey}.webp`;
}

/**
 * 全部关卡缩略图 key，与 public/images/ETB/ 下的文件一一对应。
 * 新增 / 删除关卡图片时必须同步本清单（public 目录无法在构建期枚举）。
 * 全部图片合计仅 ~300KB，存档页挂载时一次性预载后所有卡片与文件夹封面
 * 直接命中缓存，不再出现「卡片已在视口、图片才开始加载」。
 */
export const LEVEL_IMAGE_KEYS = [
  "AbandonedBase",
  "AnimatedKingdom",
  "BoilerRoom",
  "BottomFloor",
  "Bunker",
  "CaveLevel",
  "ElectricalStation",
  "Floor3",
  "GarageLevel2",
  "GraffitiLevel",
  "Grassrooms_Expanded",
  "Hotel",
  "LP_LevelPlasticMariana",
  "Level0",
  "Level05",
  "Level07",
  "Level10",
  "Level188_Expanded",
  "Level3999",
  "Level52",
  "Level9",
  "Level922",
  "Level94",
  "Level974",
  "LevelCheat",
  "LevelDash",
  "LevelFun",
  "LevelFun_Expanded",
  "LevelRun",
  "LightsOut",
  "MiddleFloor",
  "OceanMap",
  "Office",
  "Pipes1",
  "Pipes2",
  "Poolrooms",
  "Poolrooms_Expanded",
  "Snackrooms",
  "TheEnd",
  "TheHub",
  "TopFloor",
  "TunnelLevel",
  "WaterPark_Level01_P",
  "WaterPark_Level02_P",
  "WaterPark_Level03_P",
  "Zone1_Modified",
  "Zone2_Modified",
  "Zone3_Baked",
  "Zone4",
] as const;

/** 全部关卡缩略图 URL（挂载时逐个 preloadImage 即可） */
export const ALL_LEVEL_IMAGE_URLS: readonly string[] = LEVEL_IMAGE_KEYS.map(getLevelImage);

/**
 * 组件内使用：关卡 key → 本地化显示名（无翻译时回退原 key）
 */
export function useLevelName() {
  const { t, ready } = useTranslation();

  const getLevelName = (levelKey: string): string => {
    if (!levelKey) return levelKey;
    const key = `LevelName_Display.${levelKey}`;
    return t(key, { defaultValue: levelKey });
  };

  return { getLevelName, ready };
}
