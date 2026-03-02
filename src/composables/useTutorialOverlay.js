import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import storage from "@/services/storageService";

export function useTutorialOverlay(getStepData, emit) {
  const currentStep = ref(1);
  const highlightRect = ref(null);

  const steps = computed(() => getStepData());

  const currentStepData = computed(() => {
    return steps.value.find((s) => s.id === currentStep.value) || steps.value[0];
  });

  const currentHighlight = computed(() => highlightRect.value);

  const highlightStyle = computed(() => {
    if (!highlightRect.value) return {};
    const padding = 8;
    return {
      top: `${highlightRect.value.top - padding}px`,
      left: `${highlightRect.value.left - padding}px`,
      width: `${highlightRect.value.width + padding * 2}px`,
      height: `${highlightRect.value.height + padding * 2}px`,
    };
  });

  const cardStyle = computed(() => {
    if (!highlightRect.value) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
    const position = currentStepData.value.position;
    const rect = highlightRect.value;
    const cardWidth = 360;
    const cardHeight = 280;
    const gap = 20;
    let style = {};
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

  const updateHighlightRect = () => {
    const selector = currentStepData.value.targetSelector;
    const element = document.querySelector(selector);
    if (element) {
      const rect = element.getBoundingClientRect();
      highlightRect.value = { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
    } else {
      highlightRect.value = null;
    }
  };

  const handleNext = () => {
    if (currentStep.value < steps.value.length) {
      currentStep.value++;
      emit("next-step", currentStep.value);
      updateHighlightRect();
    }
  };

  const handlePrev = () => {
    if (currentStep.value > 1) {
      currentStep.value--;
      updateHighlightRect();
    }
  };

  const saveTutorialCompleted = () => {
    storage.setItem("quick_create_tutorial_completed", "true");
  };

  const handleSkip = () => {
    saveTutorialCompleted();
    emit("skip");
    emit("close");
  };

  const handleComplete = () => {
    saveTutorialCompleted();
    emit("complete");
    emit("close");
  };

  const handleVideoTutorial = () => {
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
