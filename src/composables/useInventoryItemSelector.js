import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";

const AVAILABLE_ITEMS = [
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

export function useInventoryItemSelector(getItemName) {
  const searchQuery = ref("");
  const searchInputRef = ref(null);

  const availableItems = computed(() => AVAILABLE_ITEMS);

  const filteredItems = computed(() => {
    const keyword = searchQuery.value.trim().toLowerCase();
    if (!keyword) return availableItems.value;
    return availableItems.value.filter((item) => {
      const itemId = String(item.id || "").toLowerCase();
      const itemName = String(getItemName(item.id) || "").toLowerCase();
      return itemId.includes(keyword) || itemName.includes(keyword);
    });
  });

  const clearSearch = () => {
    searchQuery.value = "";
    nextTick(() => {
      searchInputRef.value?.focus?.();
    });
  };

  const focusSearch = () => {
    nextTick(() => {
      searchInputRef.value?.focus?.();
    });
  };

  const resetSearch = () => {
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
