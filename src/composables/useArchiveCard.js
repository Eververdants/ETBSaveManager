import { ref, computed, watch, onMounted, toRefs } from "vue";

const textWidthCache = new Map();

const getTextWidth = (() => {
  let canvas = null;
  let ctx = null;
  return (text) => {
    if (textWidthCache.has(text)) return textWidthCache.get(text);
    if (!canvas) {
      canvas = document.createElement("canvas");
      ctx = canvas.getContext("2d");
      ctx.font = "500 11px system-ui, -apple-system, sans-serif";
    }
    const width = Math.ceil(ctx.measureText(text).width);
    textWidthCache.set(text, width);
    return width;
  };
})();

export function useArchiveCardStyle() {
  const tagStyle = (shortText, prefix) => {
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

export function useArchiveCardVisibility(archive) {
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
    { immediate: true }
  );

  onMounted(() => {
    localVisible.value = archive.value?.isVisible;
  });

  return { localVisible, isAnimating };
}

export function useArchiveCardActions(archive, emit) {
  const toggleVisibility = () => {
    emit("toggle-visibility", {
      ...archive.value,
      isVisible: !archive.value.isVisible,
    });
  };

  const editArchive = () => emit("edit", archive.value);
  const deleteArchive = () => emit("delete", archive.value);
  const handleCardClick = () => emit("select", archive.value);

  return { toggleVisibility, editArchive, deleteArchive, handleCardClick };
}

export function useArchiveCardEntryAnimation(index) {
  const hasEntered = ref(false);

  onMounted(() => {
    const delay = Math.min(index.value * 30, 300);
    setTimeout(() => {
      hasEntered.value = true;
    }, delay);
  });

  return { hasEntered };
}

export function useArchiveCard(archive, index, emit, translations) {
  const { tagStyle } = useArchiveCardStyle();
  const { localVisible, isAnimating } = useArchiveCardVisibility(archive);
  const { toggleVisibility, editArchive, deleteArchive, handleCardClick } = useArchiveCardActions(archive, emit);
  const { hasEntered } = useArchiveCardEntryAnimation(index);

  const isVisible = computed(() => archive.value?.isVisible);
  const currentLevelName = computed(() => translations.getLevelName(archive.value?.currentLevel));
  const backgroundImage = computed(() => `/images/ETB/${archive.value?.currentLevel}.jpg`);
  const archiveDifficultyText = computed(() => translations.getDifficultyText(archive.value?.archiveDifficulty));
  const actualDifficultyText = computed(() => translations.getDifficultyText(archive.value?.actualDifficulty));
  const archiveDifficultyClass = computed(() => `difficulty-${archive.value?.archiveDifficulty}`);
  const actualDifficultyClass = computed(() => `difficulty-${archive.value?.actualDifficulty}`);

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
