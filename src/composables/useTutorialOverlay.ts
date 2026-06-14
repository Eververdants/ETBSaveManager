import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import storage from "@/services/storageService";
import type { Ref, ComputedRef } from "vue";

interface TutorialStep {
  id: number;
  targetSelector: string;
  position?: string;
  [key: string]: unknown;
}

interface HighlightRect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

type EmitFn = (event: string, value?: unknown) => void;
type GetStepDataFn = () => TutorialStep[];

interface TutorialOverlayReturn {
  currentStep: Ref<number>;
  highlightRect: Ref<HighlightRect | null>;
  currentStepData: ComputedRef<TutorialStep>;
  currentHighlight: ComputedRef<HighlightRect | null>;
  highlightStyle: ComputedRef<Record<string, string>>;
  cardStyle: ComputedRef<Record<string, string>>;
  updateHighlightRect: () => void;
  handleNext: () => void;
  handlePrev: () => void;
  handleSkip: () => void;
  handleComplete: () => void;
  handleVideoTutorial: () => void;
  saveTutorialCompleted: () => void;
}

export function useTutorialOverlay(getStepData: GetStepDataFn, emit: EmitFn): TutorialOverlayReturn {
  const currentStep = ref(1);
  const highlightRect = ref<HighlightRect | null>(null);

  const steps = computed((): TutorialStep[] => getStepData());

  const currentStepData = computed((): TutorialStep => {
    return steps.value.find((s) => s.id === currentStep.value) || steps.value[0];
  });

  const currentHighlight = computed((): HighlightRect | null => highlightRect.value);

  const highlightStyle = computed((): Record<string, string> => {
    if (!highlightRect.value) return {};
    const padding = 8;
    return {
      top: `${highlightRect.value.top - padding}px`,
      left: `${highlightRect.value.left - padding}px`,
      width: `${highlightRect.value.width + padding * 2}px`,
      height: `${highlightRect.value.height + padding * 2}px`,
    };
  });

  const cardStyle = computed((): Record<string, string> => {
    if (!highlightRect.value) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
    const position = currentStepData.value.position;
    const rect = highlightRect.value;
    const cardWidth = 360;
    const cardHeight = 280;
    const gap = 20;
    let style: Record<string, string>;
    switch (position) {
      case "right":
        style = { top: `${Math.max(rect.top, 100)}px`, left: `${rect.right + gap}px` };
        break;
      case "left":
        style = { top: `${Math.max(rect.top, 100)}px`, left: `${rect.left - cardWidth - gap}px` };
        break;
      case "bottom":
        style = { top: `${rect.bottom + gap}px`, left: `${rect.left + (rect.width - cardWidth) / 2}px` };
        break;
      case "top":
        style = { top: `${rect.top - cardHeight - gap}px`, left: `${rect.left + (rect.width - cardWidth) / 2}px` };
        break;
      default:
        style = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
    return style;
  });

  const updateHighlightRect = (): void => {
    const selector = currentStepData.value.targetSelector;
    const element = document.querySelector(selector);
    if (element) {
      const rect = element.getBoundingClientRect();
      highlightRect.value = {
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
    } else {
      highlightRect.value = null;
    }
  };

  const handleNext = (): void => {
    if (currentStep.value < steps.value.length) {
      currentStep.value++;
      emit("next-step", currentStep.value);
      updateHighlightRect();
    }
  };

  const handlePrev = (): void => {
    if (currentStep.value > 1) {
      currentStep.value--;
      updateHighlightRect();
    }
  };

  const saveTutorialCompleted = (): void => {
    storage.setItem("quick_create_tutorial_completed", "true");
  };

  const handleSkip = (): void => {
    saveTutorialCompleted();
    emit("skip");
    emit("close");
  };

  const handleComplete = (): void => {
    saveTutorialCompleted();
    emit("complete");
    emit("close");
  };

  const handleVideoTutorial = (): void => {
    console.log("Open video tutorial");
  };

  return {
    currentStep,
    highlightRect,
    currentStepData,
    currentHighlight,
    highlightStyle,
    cardStyle,
    updateHighlightRect,
    handleNext,
    handlePrev,
    handleSkip,
    handleComplete,
    handleVideoTutorial,
    saveTutorialCompleted,
  };
}
