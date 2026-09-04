/**
 * 物品选择器 — 搜索 + 模糊建议
 *
 * 模态外壳复用 `ui/Dialog`（焦点陷阱 / 遮罩关闭 / Esc），本文件只负责
 * 物品检索与网格。物品清单派生自 `utils/itemIdMap` 的权威映射，避免与后端
 * ITEM_MAP 漂移。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";

import { Dialog, LazyImage } from "../ui";
import { fuzzySearch, type FuzzyMatchResult } from "../../utils/fuzzyMatch";
import { getPinyinTexts } from "../../utils/pinyinMap";
import { ITEM_ID_BY_NAME } from "../../utils/itemIdMap";
import { getItemImageFile } from "../../utils/itemImage";
import { cn } from "../../utils";

interface InventoryItem {
  id: string;
  image: string;
}

/** 可选物品：直接派生自权威 id 映射，图标名由 getItemImageFile 统一处理 */
const AVAILABLE_ITEMS: InventoryItem[] = Object.keys(ITEM_ID_BY_NAME).map((id) => ({
  id,
  image: getItemImageFile(id) ?? `${id}.png`,
}));

/** 物品英文名（模糊匹配多语言兜底，与 en-US/inventory.json 一致） */
const ITEM_ENGLISH_NAMES: Record<string, string> = {
  AlmondConcentrate: "Almond Concentrate",
  BugSpray: "Bug Spray",
  Camera: "Camera",
  AlmondWater: "Almond Water",
  Chainsaw: "Chainsaw",
  Crowbar: "Crowbar",
  DivingHelmet: "Diving Helmet",
  EnergyBar: "Energy Bar",
  Firework: "Firework",
  Flaregun: "Flare Gun",
  Flashlight: "Flashlight",
  GlowstickBlue: "Blue Glow Stick",
  GlowStick: "Green Glow Stick",
  GlowstickRed: "Red Glow Stick",
  GlowstickYellow: "Yellow Glow Stick",
  Knife: "Knife",
  LiquidPain: "Liquid Sorrow",
  Juice: "Juice",
  Rope: "Rope",
  LiDAR: "Scanner",
  Thermometer: "Thermometer",
  Ticket: "Ticket",
  Toy: "Teddy Bear",
  WalkieTalkie: "Walkie Talkie",
  MothJelly: "Moth Jelly",
};

export interface InventoryItemSelectorProps {
  visible: boolean;
  selectedItem: string | null;
  onClose: () => void;
  onSelect: (itemId: string | null) => void;
}

export default function InventoryItemSelector({
  visible,
  selectedItem,
  onClose,
  onSelect,
}: InventoryItemSelectorProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const getItemName = (itemId: string): string => t(`inventory.items.${itemId}`, itemId);

  const filteredItems = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return AVAILABLE_ITEMS;
    return AVAILABLE_ITEMS.filter((item) => {
      const itemId = item.id.toLowerCase();
      const itemName = getItemName(item.id).toLowerCase();
      return itemId.includes(keyword) || itemName.includes(keyword);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, t]);

  const fuzzyResults = useMemo<FuzzyMatchResult<InventoryItem>[]>(() => {
    const keyword = searchQuery.trim();
    if (filteredItems.length > 0 || !keyword) return [];
    return fuzzySearch(
      [keyword],
      AVAILABLE_ITEMS,
      (item) =>
        [
          item.id,
          getItemName(item.id),
          ITEM_ENGLISH_NAMES[item.id] || "",
          ...getPinyinTexts(item.id),
        ].filter(Boolean),
      0.3,
      5
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filteredItems.length, t]);

  // 打开后聚焦搜索框（Dialog 的焦点陷阱会先聚焦首个可聚焦元素，此处随后抢占）
  useEffect(() => {
    if (visible) {
      const rafId = requestAnimationFrame(() => searchInputRef.current?.focus());
      return () => cancelAnimationFrame(rafId);
    }
    setSearchQuery("");
  }, [visible]);

  // Esc 优先清空搜索词，空了才交给 Dialog 关闭
  const handleEscape = useCallback(() => {
    if (!searchQuery) return false;
    setSearchQuery("");
    return true;
  }, [searchQuery]);

  const selectItem = (itemId: string | null) => {
    onSelect(itemId);
    onClose();
  };

  const selectedItemLabel = selectedItem ? getItemName(selectedItem) : "";

  return (
    <Dialog
      open={visible}
      onClose={onClose}
      onEscape={handleEscape}
      title={t("inventory.selectItem")}
      maxWidth="640px"
      contentClassName="flex h-[min(85vh,720px)] flex-col"
      bodyClassName="flex min-h-0 flex-1 flex-col gap-3.5 px-5 pb-5 pt-2"
    >
      {/* 搜索栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[240px] flex-[1_1_260px]">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("inventory.searchPlaceholder")}
            className="h-9 w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] pl-10 pr-9 text-[13px] outline-none transition-all focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-ring)]"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label={t("inventory.clearSearch")}
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            {t("inventory.resultCount", {
              count: filteredItems.length,
              total: AVAILABLE_ITEMS.length,
            })}
          </span>
          {selectedItemLabel && (
            <span className="rounded-full border border-[var(--color-border-light)] bg-[var(--color-primary-subtle)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]">
              {t("inventory.currentSelection", { name: selectedItemLabel })}
            </span>
          )}
          <button
            type="button"
            onClick={() => selectItem(null)}
            className="rounded-lg border border-[var(--color-danger)]/35 bg-[var(--color-danger-subtle)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-danger)] transition-all hover:brightness-95"
          >
            {t("inventory.removeItem")}
          </button>
        </div>
      </div>

      {/* 结果区 */}
      {filteredItems.length > 0 ? (
        <div className="grid min-h-0 flex-1 grid-cols-[repeat(auto-fill,minmax(100px,1fr))] content-start gap-4 overflow-y-auto pr-1.5">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectItem(item.id)}
              className={cn(
                "flex flex-col items-center rounded-xl border p-3.5 transition-all duration-200",
                selectedItem === item.id
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] shadow-[0_0_0_2px_var(--color-ring)]"
                  : "border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] hover:-translate-y-1 hover:border-[var(--color-border-strong)] hover:shadow-[0_8px_20px_var(--color-shadow)]"
              )}
            >
              <div className="relative z-[1] mb-2.5 h-[50px] w-[50px]">
                <LazyImage
                  src={`/icons/ETB_UI/${item.image}`}
                  alt={getItemName(item.id)}
                  className="h-full w-full"
                  imageClassName="!object-contain"
                />
              </div>
              <span className="text-xs font-medium leading-tight text-[var(--color-text-primary)]">
                {getItemName(item.id)}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3.5">
          <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] px-4 py-8 text-center text-[13px] text-[var(--color-text-secondary)]">
            {t("inventory.searchEmpty")}
          </div>
          {fuzzyResults.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <p className="px-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
                {t("inventory.didYouMean")}
              </p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-3">
                {fuzzyResults.map((result) => (
                  <button
                    key={result.item.id}
                    type="button"
                    title={`${getItemName(result.item.id)} (${(result.score * 100).toFixed(0)}%)`}
                    onClick={() => selectItem(result.item.id)}
                    className="flex flex-col items-center rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] p-3 transition-all hover:-translate-y-0.5 hover:border-[var(--color-primary)]"
                  >
                    <div className="mb-2 h-[42px] w-[42px]">
                      <LazyImage
                        src={`/icons/ETB_UI/${result.item.image}`}
                        alt={getItemName(result.item.id)}
                        className="h-full w-full"
                        imageClassName="!object-contain"
                      />
                    </div>
                    <span className="text-[11px] font-medium text-[var(--color-text-primary)]">
                      {getItemName(result.item.id)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
