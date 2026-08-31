/**
 * 关卡工具 — 图片路径与 i18n 显示名
 */
import { useTranslation } from "react-i18next";

/** 关卡 key → 缩略图路径 */
export function getLevelImage(levelKey: string): string {
  return `/images/ETB/${levelKey}.webp`;
}

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
