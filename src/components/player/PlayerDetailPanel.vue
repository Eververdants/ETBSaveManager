<template>
  <div class="detail-grid">
    <!-- Sanity -->
    <div class="detail-block">
      <div class="block-title">
        <font-awesome-icon :icon="['fas', 'brain']" />
        {{ $t("editArchive.playerSanity") }}
      </div>
      <div class="sanity-display">
        <span class="sanity-num" :class="getSanityClass(currentPlayerSanity)">{{ currentPlayerSanity }}%</span>
        <div class="sanity-bar">
          <div
            class="sanity-fill"
            :style="{ width: currentPlayerSanity + '%' }"
            :class="getSanityClass(currentPlayerSanity)"
          ></div>
        </div>
      </div>
      <div class="sanity-ctrl">
        <CustomSlider v-model="currentPlayerSanity" :min="0" :max="100" :step="1" />
        <div class="quick-btns">
          <button class="qbtn danger" @click="currentPlayerSanity = 0">
            <font-awesome-icon :icon="['fas', 'skull']" />
          </button>
          <button class="qbtn success" @click="currentPlayerSanity = 100">
            <font-awesome-icon :icon="['fas', 'heart']" />
          </button>
        </div>
      </div>
      <div v-if="currentPlayerSanity === 0" class="sanity-hint">
        <font-awesome-icon :icon="['fas', 'info-circle']" />
        {{ $t("editArchive.sanityZeroHint") }}
      </div>
    </div>

    <!-- Inventory -->
    <div class="detail-block">
      <div class="block-title">
        <font-awesome-icon :icon="['fas', 'suitcase']" />
        {{ $t("editArchive.inventory") }}
      </div>
      <div class="inventory-wrap">
        <div class="hand-slots">
          <div
            v-for="slot in 3"
            :key="`h-${slot}`"
            class="inv-slot"
            :class="{ empty: !getSlotContent(slot - 1) }"
            @click="$emit('edit-slot', slot - 1)"
          >
            <span class="slot-label">{{ getSlotLabelText(slot - 1) }}</span>
            <LazyImage
              v-if="getSlotContent(slot - 1)"
              :src="`/icons/ETB_UI/${getItemImageFile(getSlotContent(slot - 1))}`"
              image-class="slot-img"
            />
            <font-awesome-icon v-else :icon="['fas', 'hand-paper']" class="slot-placeholder" />
          </div>
        </div>
        <div class="backpack-slots">
          <div
            v-for="slot in 9"
            :key="`b-${slot}`"
            class="inv-slot"
            :class="{ empty: !getSlotContent(slot + 2) }"
            @click="$emit('edit-slot', slot + 2)"
          >
            <span class="slot-num">{{ slot }}</span>
            <LazyImage
              v-if="getSlotContent(slot + 2)"
              :src="`/icons/ETB_UI/${getItemImageFile(getSlotContent(slot + 2))}`"
              image-class="slot-img"
            />
            <font-awesome-icon v-else :icon="['fas', 'cube']" class="slot-placeholder" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import CustomSlider from "@/components/ui/CustomSlider.vue";
import LazyImage from "@/components/ui/LazyImage.vue";
import { getItemImageFile } from "@/utils/itemImage";

const props = defineProps({
  // The active player object; null renders nothing (host shows its empty hint)
  player: { type: Object, default: null },
  // i18n namespace of the host page for the hand-slot labels
  slotLabelPrefix: { type: String, required: true },
});

const emit = defineEmits(["edit-slot", "sanity-change"]);

const { t, te } = useI18n({ useScope: "global" });

/* Current selected player's sanity */
const currentPlayerSanity = ref(props.player?.sanity ?? 100);

/* Sync when the host switches to a different player */
watch(
  () => props.player,
  (p) => {
    if (p) currentPlayerSanity.value = p.sanity ?? 100;
  },
);

/* Report changes so the host can persist into its own state */
watch(currentPlayerSanity, (val) => {
  const numVal = Number(val);
  emit("sanity-change", Math.max(0, Math.min(100, isNaN(numVal) ? 100 : numVal)));
});

/* Style determination */
const getSanityClass = (val) => {
  if (val >= 80) return "sanity-high";
  if (val >= 50) return "sanity-medium";
  if (val >= 20) return "sanity-low";
  return "sanity-critical";
};

const getSlotContent = (slotIndex) => {
  const item = props.player?.inventory?.[slotIndex];
  return item && item !== "None" ? item : null;
};

const getSlotLabelText = (slotIndex) => {
  const labels = ["mainHand", "offHand1", "offHand2"];
  const label = labels[slotIndex] || "";
  const translationKey = `${props.slotLabelPrefix}.${label}`;
  return te(translationKey) ? t(translationKey) : label;
};
</script>

<style scoped>
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-block {
  background: linear-gradient(145deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
  border-radius: var(--radius-md);
  padding: 18px;
  border: 1px solid var(--border-color);
  transition: all var(--transition-normal) var(--ease-default);
}

.detail-block:hover {
  border-color: color-mix(in srgb, var(--primary) 15%, transparent);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.block-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.block-title svg {
  color: var(--primary);
}

/* Sanity editor */
.sanity-display {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.sanity-num {
  font-size: 28px;
  font-weight: 800;
  min-width: 70px;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.sanity-num.sanity-high {
  color: #10b981;
  text-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
}

.sanity-num.sanity-medium {
  color: #f59e0b;
  text-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
}

.sanity-num.sanity-low {
  color: #ef4444;
  text-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
}

.sanity-num.sanity-critical {
  color: #dc2626;
  text-shadow: 0 2px 8px rgba(220, 38, 38, 0.2);
  animation: pulse-critical 2s ease-in-out infinite;
}

@keyframes pulse-critical {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.sanity-bar {
  flex: 1;
  height: 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-pill);
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sanity-fill {
  height: 100%;
  border-radius: var(--radius-pill);
  transition:
    width 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    background 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.sanity-fill::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.2), transparent);
  border-radius: var(--radius-pill) var(--radius-pill) 0 0;
}

.sanity-fill.sanity-high {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.sanity-fill.sanity-medium {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.sanity-fill.sanity-low {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.sanity-fill.sanity-critical {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
}

.sanity-ctrl {
  display: flex;
  align-items: center;
  gap: 14px;
}

.sanity-ctrl > :first-child {
  flex: 1;
}

.sanity-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.06) 100%);
  color: var(--error-color, #ef4444);
  font-size: 12px;
  line-height: 1.5;
  border: 1px solid rgba(239, 68, 68, 0.15);
}

.sanity-hint svg {
  font-size: 13px;
  flex-shrink: 0;
}

.quick-btns {
  display: flex;
  gap: 8px;
}

.qbtn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-normal) var(--ease-default);
  font-size: 16px;
}

.qbtn.danger {
  background: linear-gradient(135deg, rgba(255, 59, 48, 0.12) 0%, rgba(255, 59, 48, 0.06) 100%);
  color: #ff3b30;
  border: 1px solid rgba(255, 59, 48, 0.2);
}

.qbtn.danger:hover {
  background: linear-gradient(135deg, rgba(255, 59, 48, 0.2) 0%, rgba(255, 59, 48, 0.12) 100%);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.2);
}

.qbtn.danger:active {
  transform: scale(0.95);
}

.qbtn.success {
  background: linear-gradient(135deg, rgba(52, 199, 89, 0.12) 0%, rgba(52, 199, 89, 0.06) 100%);
  color: #34c759;
  border: 1px solid rgba(52, 199, 89, 0.2);
}

.qbtn.success:hover {
  background: linear-gradient(135deg, rgba(52, 199, 89, 0.2) 0%, rgba(52, 199, 89, 0.12) 100%);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(52, 199, 89, 0.2);
}

.qbtn.success:active {
  transform: scale(0.95);
}

/* Inventory slots */
.inventory-wrap {
  display: flex;
  gap: 18px;
}

.hand-slots {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.backpack-slots {
  display: grid;
  grid-template-columns: repeat(3, 58px);
  gap: 10px;
}

.inv-slot {
  position: relative;
  width: 58px;
  height: 58px;
  border-radius: var(--radius-sm);
  background: linear-gradient(145deg, var(--card-bg) 0%, var(--bg-secondary) 100%);
  border: 2px solid var(--border-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-normal) var(--ease-default);
  overflow: hidden;
}

.inv-slot::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(var(--primary-rgb, 99, 102, 241), 0.15) 0%, transparent 70%);
  opacity: 0;
  transition: opacity var(--transition-normal) var(--ease-default);
}

.inv-slot:hover {
  border-color: var(--primary);
  transform: scale(1.08) translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.inv-slot:hover::before {
  opacity: 1;
}

.inv-slot.empty {
  border-style: dashed;
  border-color: color-mix(in srgb, var(--border-color) 70%, transparent);
}

.inv-slot.empty:hover {
  border-color: var(--primary);
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--primary) 8%, var(--card-bg)) 0%,
    var(--bg-secondary) 100%
  );
}

.inv-slot.empty .slot-placeholder {
  transition: all var(--transition-normal) var(--ease-default);
}

.inv-slot.empty:hover .slot-placeholder {
  color: var(--primary);
  transform: scale(1.1);
  opacity: 0.6;
}

.slot-label {
  position: absolute;
  top: 4px;
  left: 4px;
  font-size: 9px;
  font-weight: 600;
  color: var(--text-tertiary);
  background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  letter-spacing: 0.02em;
}

.slot-num {
  position: absolute;
  top: 4px;
  right: 5px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}

.slot-img {
  width: 38px;
  height: 38px;
  object-fit: contain;
  transition: transform var(--transition-normal) var(--ease-default);
}

.inv-slot:hover .slot-img {
  transform: scale(1.1);
}

.slot-placeholder {
  font-size: 20px;
  color: var(--text-tertiary);
  opacity: 0.35;
}

/* Responsive */
@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .inventory-wrap {
    flex-direction: column;
  }

  .hand-slots {
    flex-direction: row;
    justify-content: center;
  }
}
</style>
