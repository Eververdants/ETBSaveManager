import { ref, computed, watch, onMounted, type Ref, type ComputedRef } from "vue";
import type { ArchiveData } from "@/types";

interface Translations {
  getLevelName: (level: string) => string;
  getDifficultyText: (difficulty: string) => string;
}

interface CardTagStyle {
  "--w-short": string;
  "--w-full": string;
}

interface CardActions {
  toggleVisibility: () => void;
  editArchive: () => void;
  deleteArchive: () => void;
  handleCardClick: () => void;
}

/** Aggregated display data from archive — single computed reduces reactive dependency tracking */
interface CardComputedData {
  isVisible: boolean | undefined;
  currentLevelName: string;
  backgroundImage: string;
  archiveDifficultyText: string;
  actualDifficultyText: string;
  archiveDifficultyClass: string;
  actualDifficultyClass: string;
}

const textWidthCache = new Map<string, number>();
const MAX_CACHE_SIZE = 100;

export const isInitialLoad = ref(true);

export function markInitialLoadComplete(): void {
  isInitialLoad.value = false;
}

export function resetInitialLoad(): void {
  isInitialLoad.value = true;
}

const getTextWidth = (() => {
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  return (text: string): number => {
    if (textWidthCache.has(text)) return textWidthCache.get(text)!;
    if (!canvas) {
      canvas = document.createElement("canvas");
      ctx = canvas.getContext("2d")!;
      ctx.font = "500 11px system-ui, -apple-system, sans-serif";
    }
    const width = Math.ceil(ctx!.measureText(text).width);
    textWidthCache.set(text, width);
    if (textWidthCache.size > MAX_CACHE_SIZE) {
      const firstKey = textWidthCache.keys().next().value;
      if (firstKey) textWidthCache.delete(firstKey);
    }
    return width;
  };
})();

export function useArchiveCardStyle(): {
  tagStyle: (shortText: string, prefix: string) => CardTagStyle;
} {
  const tagStyle = (shortText: string, prefix: string): CardTagStyle => {
    const shortWidth = Math.max(30, getTextWidth(shortText) + 16);
    const fullText = `${prefix}:${shortText}`;
    const fullWidth = Math.max(shortWidth, getTextWidth(fullText) + 24);
    return {
      "--w-short": `${shortWidth}px`,
      "--w-full": `${fullWidth}px`,
    };
  };

  return { tagStyle };
}

export function useArchiveCardVisibility(archive: Ref<ArchiveData>): {
  localVisible: Ref<boolean | undefined>;
  isAnimating: Ref<boolean>;
} {
  const localVisible = ref(archive.value?.isVisible);
  const isAnimating = ref(false);

  watch(
    () => archive.value?.isVisible,
    (newVal) => {
      if (newVal !== localVisible.value) {
        isAnimating.value = true;
        localVisible.value = newVal;
        setTimeout(() => {
          isAnimating.value = false;
        }, 250);
      }
    },
    { immediate: true },
  );

  onMounted(() => {
    localVisible.value = archive.value?.isVisible;
  });

  return { localVisible, isAnimating };
}

export function useArchiveCardActions(
  archive: Ref<ArchiveData>,
  emit: (event: string, ...args: unknown[]) => void,
): CardActions {
  const toggleVisibility = (): void => {
    emit("toggle-visibility", {
      ...archive.value,
      isVisible: !archive.value.isVisible,
    });
  };

  const editArchive = (): void => emit("edit", archive.value);
  const deleteArchive = (): void => emit("delete", archive.value);
  const handleCardClick = (): void => emit("select", archive.value);

  return { toggleVisibility, editArchive, deleteArchive, handleCardClick };
}

export function useArchiveCardEntryAnimation(_index: Ref<number>): void {
  // Entrance animation is handled by Home.vue via direct DOM manipulation
  // after the virtualizer settles. This approach avoids Vue scoped-CSS
  // specificity issues and ref-timing problems with virtual scroll.
}

export function useArchiveCard(
  archive: Ref<ArchiveData>,
  index: Ref<number>,
  emit: (event: string, ...args: unknown[]) => void,
  translations: Translations,
): {
  localVisible: Ref<boolean | undefined>;
  isAnimating: Ref<boolean>;
  cardData: ComputedRef<CardComputedData | null>;
  tagStyle: (shortText: string, prefix: string) => CardTagStyle;
  toggleVisibility: () => void;
  editArchive: () => void;
  deleteArchive: () => void;
  handleCardClick: () => void;
} {
  const { tagStyle } = useArchiveCardStyle();
  const { localVisible, isAnimating } = useArchiveCardVisibility(archive);
  const { toggleVisibility, editArchive, deleteArchive, handleCardClick } = useArchiveCardActions(archive, emit);
  useArchiveCardEntryAnimation(index);

  // Aggregate computed: reads archive.value ONCE, all transformations in one pass
  const cardData = computed((): CardComputedData | null => {
    const a = archive.value;
    if (!a) return null;
    return {
      isVisible: a.isVisible,
      currentLevelName: translations.getLevelName(a.currentLevel ?? ""),
      backgroundImage: `/images/ETB/${a.currentLevel}.webp`,
      archiveDifficultyText: translations.getDifficultyText(a.archiveDifficulty ?? ""),
      actualDifficultyText: translations.getDifficultyText(a.actualDifficulty ?? ""),
      archiveDifficultyClass: `difficulty-${a.archiveDifficulty}`,
      actualDifficultyClass: `difficulty-${a.actualDifficulty}`,
    };
  });

  return {
    localVisible,
    isAnimating,
    cardData,
    tagStyle,
    toggleVisibility,
    editArchive,
    deleteArchive,
    handleCardClick,
  };
}
