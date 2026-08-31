/**
 * 玩家详情面板 — 理智滑块 + 12 格背包（3 手持 + 9 背包）
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Brain, Briefcase, Hand, Box, Info, Heart, Skull } from "lucide-react";

import { Slider } from "../ui";
import { LazyImage } from "../ui";
import { getItemImageFile } from "../../utils/itemImage";
import { getSanityClass } from "./PlayerManager";
import { cn } from "../../utils";

export interface PlayerDetail {
  sanity: number;
  /** 12 格；空槽为 null / "None" */
  inventory: (string | null)[];
}

export interface PlayerDetailPanelProps {
  /** 当前玩家；null 时宿主自行渲染空提示 */
  player: PlayerDetail | null;
  /** 手持槽 i18n 前缀（editArchive / createArchive） */
  slotLabelPrefix: string;
  onEditSlot: (slotIndex: number) => void;
  onSanityChange: (sanity: number) => void;
}

const HAND_SLOT_KEYS = ["mainHand", "offHand1", "offHand2"] as const;

const SANITY_COLORS: Record<string, string> = {
  "sanity-high": "var(--color-success)",
  "sanity-medium": "#c2820c",
  "sanity-low": "var(--color-danger)",
  "sanity-critical": "var(--color-danger)",
};

export default function PlayerDetailPanel({
  player,
  slotLabelPrefix,
  onEditSlot,
  onSanityChange,
}: PlayerDetailPanelProps) {
  const { t } = useTranslation();
  const [sanity, setSanity] = useState(player?.sanity ?? 100);

  // 切换玩家时同步理智值
  useEffect(() => {
    if (player) setSanity(player.sanity ?? 100);
  }, [player]);

  const clamp = (val: number) => Math.max(0, Math.min(100, Number.isNaN(val) ? 100 : val));

  const handleSanity = (val: number) => {
    const clamped = clamp(val);
    setSanity(clamped);
    onSanityChange(clamped);
  };

  const getSlotContent = (slotIndex: number): string | null => {
    const item = player?.inventory?.[slotIndex];
    return item && item !== "None" ? item : null;
  };

  const getSlotLabel = (slotIndex: number): string => {
    const key = HAND_SLOT_KEYS[slotIndex] ?? "";
    return t(`${slotLabelPrefix}.${key}`, key);
  };

  if (!player) return null;

  const sanityCls = getSanityClass(sanity);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 理智 */}
      <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-elevated)] p-4.5">
        <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[var(--color-text-secondary)]">
          <Brain size={14} className="text-[var(--color-primary)]" />
          {t("editArchive.playerSanity")}
        </div>
        <div className="mb-4 flex items-center gap-3.5">
          <span
            className="min-w-[70px] text-[26px] font-extrabold tabular-nums tracking-tight"
            style={{ color: SANITY_COLORS[sanityCls] }}
          >
            {sanity}%
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-bg-muted)]">
            <div
              className="h-full rounded-full transition-[width] duration-200"
              style={{ width: `${sanity}%`, backgroundColor: SANITY_COLORS[sanityCls] }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Slider value={sanity} min={0} max={100} step={1} onChange={handleSanity} />
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              aria-label="0"
              onClick={() => handleSanity(0)}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-danger-subtle)] text-[var(--color-danger)] transition-transform hover:scale-110 active:scale-95"
            >
              <Skull size={13} />
            </button>
            <button
              type="button"
              aria-label="100"
              onClick={() => handleSanity(100)}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-success-subtle)] text-[var(--color-success)] transition-transform hover:scale-110 active:scale-95"
            >
              <Heart size={13} />
            </button>
          </div>
        </div>
        {sanity === 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <Info size={13} className="shrink-0 text-[var(--color-primary)]" />
            {t("editArchive.sanityZeroHint")}
          </div>
        )}
      </div>

      {/* 背包 */}
      <div className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-elevated)] p-4.5">
        <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-[var(--color-text-secondary)]">
          <Briefcase size={14} className="text-[var(--color-primary)]" />
          {t("editArchive.inventory")}
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }, (_, i) => i).map((slot) => {
              const content = getSlotContent(slot);
              return (
                <Slot
                  key={`hand-${slot}`}
                  label={getSlotLabel(slot)}
                  content={content}
                  onClick={() => onEditSlot(slot)}
                />
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((slot) => {
              const content = getSlotContent(slot + 2);
              return (
                <Slot
                  key={`bag-${slot}`}
                  label={String(slot)}
                  content={content}
                  onClick={() => onEditSlot(slot + 2)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Slot({
  label,
  content,
  onClick,
}: {
  label: string;
  content: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex aspect-square items-center justify-center rounded-lg border p-1.5 transition-all duration-150",
        content
          ? "border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-primary)]"
          : "border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-border-strong)]"
      )}
    >
      <span className="absolute left-1.5 top-1 text-[10px] font-medium text-[var(--color-text-muted)]">
        {label}
      </span>
      {content ? (
        <LazyImage
          src={`/icons/ETB_UI/${getItemImageFile(content)}`}
          alt={content}
          className="h-full w-full"
          imageClassName="!relative !inset-auto !h-9 !w-9 !object-contain mx-auto mt-2"
        />
      ) : label.match(/^\d+$/) ? (
        <Box size={16} className="text-[var(--color-text-muted)] opacity-40" />
      ) : (
        <Hand size={16} className="text-[var(--color-text-muted)] opacity-40" />
      )}
    </button>
  );
}
