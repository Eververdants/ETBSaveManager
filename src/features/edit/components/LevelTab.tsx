/**
 * 编辑存档 — 关卡 Tab
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { LevelPicker } from "../../../components/save";
import { useLevelGroups } from "../../../hooks/useLevelGroups";

export interface LevelTabProps {
  currentLevel: string;
  onCurrentLevelChange: (levelKey: string) => void;
}

export default function LevelTab({ currentLevel, onCurrentLevelChange }: LevelTabProps) {
  const { t } = useTranslation();
  const { groups } = useLevelGroups();
  const [activeGroup, setActiveGroup] = useState(0);

  return (
    <LevelPicker
      groups={groups}
      selectedKey={currentLevel}
      activeGroup={activeGroup}
      onActiveGroupChange={setActiveGroup}
      onSelect={(card) => onCurrentLevelChange(card.levelKey)}
      searchPlaceholder={t("editArchive.levelSearchPlaceholder")}
      emptyText={t("editArchive.levelSearchEmpty")}
      badgeText={t("editArchive.unlockMainBadge")}
    />
  );
}
