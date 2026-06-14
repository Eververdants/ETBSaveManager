import { ref, computed, watch, onMounted, onActivated, type Ref, type ComputedRef } from "vue";
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

const textWidthCache = new Map<string, number>();

let isInitialLoad = ref(true);

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

export function useArchiveCardActions(archive: Ref<ArchiveData>, emit: (event: string, ...args: unknown[]) => void): CardActions {
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

export function useArchiveCardEntryAnimation(index: Ref<number>): {
  hasEntered: Ref<boolean>;
} {
  const hasEntered = ref(false);

  const triggerAnimation = (): void => {
    const shouldAnimate = isInitialLoad.value && index.value < 15;
    if (shouldAnimate) {
      const delay = Math.min(index.value * 30, 300);
      setTimeout(() => {
        hasEntered.value = true;
      }, delay);
    } else {
      hasEntered.value = true;
    }
  };

  onMounted(() => {
    triggerAnimation();
  });

  onActivated(() => {
    if (!hasEntered.value) {
      triggerAnimation();
    }
  });

  return { hasEntered };
}

export function useArchiveCard(
  archive: Ref<ArchiveData>,
  index: Ref<number>,
  emit: (event: string, ...args: unknown[]) => void,
  translations: Translations,
): {
  hasEntered: Ref<boolean>;
  localVisible: Ref<boolean | undefined>;
  isAnimating: Ref<boolean>;
  isVisible: ComputedRef<boolean | undefined>;
  currentLevelName: ComputedRef<string>;
  backgroundImage: ComputedRef<string>;
  archiveDifficultyText: ComputedRef<string>;
  actualDifficultyText: ComputedRef<string>;
  archiveDifficultyClass: ComputedRef<string>;
  actualDifficultyClass: ComputedRef<string>;
  tagStyle: (shortText: string, prefix: string) => CardTagStyle;
  toggleVisibility: () => void;
  editArchive: () => void;
  deleteArchive: () => void;
  handleCardClick: () => void;
} {
  const { tagStyle } = useArchiveCardStyle();
  const { localVisible, isAnimating } = useArchiveCardVisibility(archive);
  const { toggleVisibility, editArchive, deleteArchive, handleCardClick } = useArchiveCardActions(archive, emit);
  const { hasEntered } = useArchiveCardEntryAnimation(index);

  const isVisible = computed((): boolean | undefined => archive.value?.isVisible);
  const currentLevelName = computed((): string => translations.getLevelName(archive.value?.currentLevel ?? ""));
  const backgroundImage = computed((): string => `/images/ETB/${archive.value?.currentLevel}.jpg`);
  const archiveDifficultyText = computed((): string => translations.getDifficultyText(archive.value?.archiveDifficulty ?? ""));
  const actualDifficultyText = computed((): string => translations.getDifficultyText(archive.value?.actualDifficulty ?? ""));
  const archiveDifficultyClass = computed((): string => `difficulty-${archive.value?.archiveDifficulty}`);
  const actualDifficultyClass = computed((): string => `difficulty-${archive.value?.actualDifficulty}`);

  return {
    hasEntered,
    localVisible,
    isAnimating,
    isVisible,
    currentLevelName,
    backgroundImage,
    archiveDifficultyText,
    actualDifficultyText,
    archiveDifficultyClass,
    actualDifficultyClass,
    tagStyle,
    toggleVisibility,
    editArchive,
    deleteArchive,
    handleCardClick,
  };
}
