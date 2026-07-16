import { ref, computed, nextTick } from "vue";
import type { ComputedRef, Ref } from "vue";
import { pinyin } from "pinyin-pro";
import { fuzzySearch, type FuzzyMatchResult } from "@/utils/fuzzyMatch";
import { getPinyinTexts } from "@/utils/pinyinMap";

interface InventoryItem {
  id: string;
  image: string;
}

interface InventoryItemSelectorReturn {
  searchQuery: Ref<string>;
  searchInputRef: Ref<{ focus: () => void } | null>;
  availableItems: ComputedRef<InventoryItem[]>;
  filteredItems: ComputedRef<InventoryItem[]>;
  hasExactMatches: ComputedRef<boolean>;
  fuzzyResults: ComputedRef<FuzzyMatchResult<InventoryItem>[]>;
  clearSearch: () => void;
  focusSearch: () => void;
  resetSearch: () => void;
}

const AVAILABLE_ITEMS: InventoryItem[] = [
  { id: "AlmondConcentrate", image: "AlmondConcentrate.png" },
  { id: "BugSpray", image: "BugSpray.png" },
  { id: "Camera", image: "Camera.png" },
  { id: "AlmondWater", image: "AlmondWater.png" },
  { id: "Chainsaw", image: "Chainsaw.png" },
  { id: "Crowbar", image: "Crowbar.png" },
  { id: "DivingHelmet", image: "DivingHelmet.png" },
  { id: "EnergyBar", image: "EnergyBar.png" },
  { id: "Firework", image: "Firework.png" },
  { id: "Flaregun", image: "Flaregun.png" },
  { id: "Flashlight", image: "Flashlight.png" },
  { id: "GlowstickBlue", image: "GlowstickBlue.png" },
  { id: "GlowStick", image: "GlowStick.png" },
  { id: "GlowstickRed", image: "GlowstickRed.png" },
  { id: "GlowstickYellow", image: "GlowstickYellow.png" },
  { id: "Knife", image: "Knife.png" },
  { id: "LiquidPain", image: "LiquidPain.png" },
  { id: "Juice", image: "Juice.png" },
  { id: "Rope", image: "Rope.png" },
  { id: "LiDAR", image: "LiDAR.png" },
  { id: "Thermometer", image: "Thermometer.png" },
  { id: "Ticket", image: "Ticket.png" },
  { id: "Toy", image: "Teddy_Bear.png" },
  { id: "WalkieTalkie", image: "WalkieTalkie.png" },
  { id: "MothJelly", image: "MothJelly.png" },
];

/**
 * 物品英文显示名（用于模糊匹配时的多语言兜底）
 * 与 src/i18n/locales/en-US/inventory.json 保持一致
 */
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

export function useInventoryItemSelector(getItemName: (id: string) => string): InventoryItemSelectorReturn {
  const searchQuery = ref("");
  const searchInputRef = ref<{ focus: () => void } | null>(null);

  const availableItems = computed((): InventoryItem[] => AVAILABLE_ITEMS);

  const filteredItems = computed((): InventoryItem[] => {
    const keyword = searchQuery.value.trim().toLowerCase();
    if (!keyword) return availableItems.value;
    return availableItems.value.filter((item) => {
      const itemId = String(item.id || "").toLowerCase();
      const itemName = String(getItemName(item.id) || "").toLowerCase();
      return itemId.includes(keyword) || itemName.includes(keyword);
    });
  });

  /** 是否有精确搜索结果 */
  const hasExactMatches = computed(() => filteredItems.value.length > 0);

  /**
   * 无精确搜索结果时的模糊匹配建议
   * 同时匹配物品 ID、当前语言翻译名、英文显示名三种文本
   */
  const fuzzyResults = computed<FuzzyMatchResult<InventoryItem>[]>(() => {
    const keyword = searchQuery.value.trim();
    if (hasExactMatches.value || !keyword) return [];

    // 如果输入包含中文，同时用原文和拼音进行匹配（处理同音字）
    const hasChinese = /[一-鿿]/.test(keyword);
    const queries = hasChinese ? [keyword, pinyin(keyword, { toneType: "none", type: "array" }).join("")] : [keyword];

    return fuzzySearch(
      queries,
      availableItems.value,
      (item) =>
        [item.id, getItemName(item.id), ITEM_ENGLISH_NAMES[item.id] || "", ...getPinyinTexts(item.id)].filter(Boolean),
      0.3,
      5,
    );
  });

  const clearSearch = (): void => {
    searchQuery.value = "";
    nextTick(() => {
      searchInputRef.value?.focus?.();
    });
  };

  const focusSearch = (): void => {
    nextTick(() => {
      searchInputRef.value?.focus?.();
    });
  };

  const resetSearch = (): void => {
    searchQuery.value = "";
  };

  return {
    searchQuery,
    searchInputRef,
    availableItems,
    filteredItems,
    hasExactMatches,
    fuzzyResults,
    clearSearch,
    focusSearch,
    resetSearch,
  };
}
