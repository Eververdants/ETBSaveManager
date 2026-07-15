import { ref, computed, nextTick } from "vue";
import type { ComputedRef, Ref } from "vue";

interface InventoryItem {
  id: string;
  image: string;
}

interface InventoryItemSelectorReturn {
  searchQuery: Ref<string>;
  searchInputRef: Ref<{ focus: () => void } | null>;
  availableItems: ComputedRef<InventoryItem[]>;
  filteredItems: ComputedRef<InventoryItem[]>;
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
    clearSearch,
    focusSearch,
    resetSearch,
  };
}
