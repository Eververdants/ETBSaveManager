/**
 * 关卡分组构建 Hook — 结局路线分组 + 特殊关卡 + 跨语言搜索名
 * （对应 master LevelTab.vue / Step1SelectLevel.vue 的分组逻辑）
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { ENDING_LEVELS, ENDINGS_CONFIG } from "../constants/endings";
import { getLevelImage, useLevelName } from "../utils/levelUtils";
import type { LevelGroup } from "../components/save";

// en/zh 名称表：输入 "Ocean Map" 也能在中文界面下搜到关卡
import enNames from "../locales/en-US/LevelName_Display.json";
import zhNames from "../locales/zh-CN/LevelName_Display.json";

type NameMap = Record<string, string>;

export function useLevelGroups() {
  const { t, i18n } = useTranslation();
  // 关卡显示名复用 utils/levelUtils 的权威实现（原先此处重复了一份）
  const { getLevelName: getLevelDisplayName } = useLevelName();

  const altName = (levelKey: string): string => {
    const map = i18n.language === "en-US" ? (zhNames as NameMap) : (enNames as NameMap);
    return map[levelKey] || "";
  };

  const groups = useMemo<LevelGroup[]>(() => {
    const mainRouteSet = new Set(ENDING_LEVELS[0]);

    const mkLevel = (levelKey: string) => {
      const name = getLevelDisplayName(levelKey);
      const alt = altName(levelKey);
      return {
        levelKey,
        name,
        altName: alt,
        image: getLevelImage(levelKey),
        _search: `${name} ${alt} ${levelKey}`.toLowerCase(),
      };
    };

    const result: LevelGroup[] = ENDINGS_CONFIG.map((cfg) => {
      const label = t(`createArchive.endings.${cfg.labelKey}`);
      return {
        id: String(cfg.id),
        label,
        levels: (ENDING_LEVELS[cfg.id] || []).map((k) => {
          const level = mkLevel(k);
          return {
            ...level,
            ...(cfg.id !== 0 && mainRouteSet.has(k) ? { unlockMain: true } : {}),
            routeLabel: label,
          };
        }),
      };
    });

    // 特殊关卡：不属于任何路线（如 LevelCheat）
    const known = new Set(Object.values(ENDING_LEVELS).flat());
    const specials = ["LevelCheat"].filter((k) => !known.has(k));
    if (specials.length > 0) {
      result.push({
        id: "special",
        label: t("editArchive.levelGroup.special"),
        levels: specials.map(mkLevel),
      });
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, i18n.language]);

  return { groups, getLevelDisplayName };
}
