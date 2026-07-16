import { ref, computed, watch, nextTick } from "vue";
import { useRoute } from "vue-router";
import { gsap } from "gsap";
import storage from "@/services/storageService";
import type { Ref, ComputedRef } from "vue";
import type { RouteLocationNormalizedLoaded } from "vue-router";

type EmitFn = (event: string) => void;
type TranslateFn = (key: string) => string;

const CONTAINER_STYLES: Record<string, string> = {
  position: "fixed",
  bottom: "30px",
  right: "30px",
  top: "auto",
  left: "auto",
  transform: "none",
  margin: "0",
  padding: "0",
};

const GSAP_DEFAULTS: gsap.TweenVars = {
  ease: "power2.out",
  force3D: false,
  immediateRender: false,
};

const ICONS: string[] = ["search", "folder", "refresh"];
const ICON_MAP: Record<string, string> = {
  search: "magnifying-glass",
  folder: "folder",
  refresh: "arrow-rotate-right",
};
const TOOLTIP_KEYS: Record<string, string> = {
  search: "floatingButton.searchArchive",
  folder: "floatingButton.openFolder",
  refresh: "floatingButton.refreshList",
};
const EVENT_MAP: Record<string, string> = {
  search: "search-click",
  folder: "folder-click",
  refresh: "refresh-click",
};

interface FloatingActionButtonReturn {
  actionButton: Ref<HTMLElement | null>;
  currentIconEl: Ref<HTMLElement | null>;
  nextIconEl: Ref<HTMLElement | null>;
  tooltip: Ref<HTMLElement | null>;
  floatingActionContainer: Ref<HTMLElement | null>;
  currentIndex: Ref<number>;
  displayIndex: Ref<number>;
  nextDisplayIndex: Ref<number>;
  isHovered: Ref<boolean>;
  isAnimating: Ref<boolean>;
  isHomePage: ComputedRef<boolean>;
  shouldRender: Ref<boolean>;
  isVisible: Ref<boolean>;
  displayIcon: ComputedRef<string>;
  nextIcon: ComputedRef<string>;
  getCurrentTooltip: ComputedRef<string>;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  handleWheel: (event: WheelEvent) => void;
  handleMouseDown: () => void;
  handleMouseUp: () => void;
  handleClick: () => void;
  onMountedHandler: () => void;
  onUnmountedHandler: () => void;
}

export function useFloatingActionButton(emit: EmitFn, t: TranslateFn): FloatingActionButtonReturn {
  const route: RouteLocationNormalizedLoaded = useRoute();
  const actionButton = ref<HTMLElement | null>(null);
  const currentIconEl = ref<HTMLElement | null>(null);
  const nextIconEl = ref<HTMLElement | null>(null);
  const tooltip = ref<HTMLElement | null>(null);
  const floatingActionContainer = ref<HTMLElement | null>(null);

  const currentIndex = ref(0);
  const displayIndex = ref(0);
  const nextDisplayIndex = ref(1);
  const isHovered = ref(false);
  const isAnimating = ref(false);
  const isTransitioning = ref(false);

  let tooltipTimer: ReturnType<typeof setTimeout> | null = null;

  const isHomePage = computed((): boolean => route.name === "Home");
  const shouldRender = ref(isHomePage.value);
  const isVisible = ref(isHomePage.value);

  const displayIcon = computed((): string => ICON_MAP[ICONS[displayIndex.value]] || "magnifying-glass");
  const nextIcon = computed((): string => ICON_MAP[ICONS[nextDisplayIndex.value]] || "magnifying-glass");
  const getCurrentTooltip = computed((): string => t(TOOLTIP_KEYS[ICONS[currentIndex.value]] || TOOLTIP_KEYS.search));

  const applyContainerStyles = (container: HTMLElement | null, extra: Record<string, string> = {}): void => {
    if (!container) return;
    Object.entries({ ...CONTAINER_STYLES, ...extra }).forEach(([k, v]) =>
      container.style.setProperty(k, v, "important"),
    );
  };

  const showFloatingButton = (): void => {
    const container = floatingActionContainer.value;
    if (!container) {
      setTimeout(showFloatingButton, 100);
      return;
    }
    isTransitioning.value = true;
    gsap.fromTo(
      container,
      { opacity: 0, scale: 0.8, y: 20 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.35,
        ease: "back.out(1.2)",
        onComplete: () => {
          isTransitioning.value = false;
        },
      },
    );
  };

  const hideFloatingButton = (): void => {
    const container = floatingActionContainer.value;
    if (!container) {
      shouldRender.value = false;
      return;
    }
    isTransitioning.value = true;
    gsap.to(container, {
      opacity: 0,
      scale: 0.8,
      y: 20,
      duration: 0.25,
      ease: "power2.in",
      onComplete: () => {
        shouldRender.value = false;
        isTransitioning.value = false;
      },
    });
  };

  const clearTooltipTimer = (): void => {
    if (tooltipTimer) {
      clearTimeout(tooltipTimer);
      tooltipTimer = null;
    }
  };

  const handleMouseEnter = (): void => {
    isHovered.value = true;
    clearTooltipTimer();
    gsap.killTweensOf(tooltip.value);
    tooltipTimer = setTimeout(() => {
      if (isHovered.value && tooltip.value) {
        gsap.to(tooltip.value, { opacity: 1, y: 0, visibility: "visible", duration: 0.3, ...GSAP_DEFAULTS });
      }
    }, 100);
  };

  const handleMouseLeave = (): void => {
    isHovered.value = false;
    clearTooltipTimer();
    gsap.killTweensOf(tooltip.value);
    gsap.to(actionButton.value, { scale: 1, duration: 0.08, ease: "power2.out" });
    tooltipTimer = setTimeout(() => {
      if (!isHovered.value && tooltip.value) {
        gsap.to(tooltip.value, {
          opacity: 0,
          y: 10,
          duration: 0.2,
          ...GSAP_DEFAULTS,
          onComplete: () => {
            if (tooltip.value) tooltip.value.style.visibility = "hidden";
          },
        });
      }
    }, 150);
  };

  const handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    if (isAnimating.value) return;
    isAnimating.value = true;
    const direction = event.deltaY > 0 ? 1 : -1;
    const newIndex = (currentIndex.value + direction + ICONS.length) % ICONS.length;
    nextDisplayIndex.value = newIndex;
    gsap.killTweensOf(currentIconEl.value);
    gsap.killTweensOf(nextIconEl.value);
    gsap.killTweensOf(tooltip.value);
    gsap.to(tooltip.value, {
      opacity: 0,
      duration: 0.1,
      ...GSAP_DEFAULTS,
      onComplete: () => {
        currentIndex.value = newIndex;
        gsap.to(tooltip.value, { opacity: 1, y: 0, visibility: "visible", duration: 0.15, ...GSAP_DEFAULTS });
      },
    });
    gsap.set(nextIconEl.value, { y: direction * 40, opacity: 1 });
    const duration = 0.25;
    gsap.to(currentIconEl.value, { y: -direction * 40, opacity: 0, duration, ease: "power2.inOut" });
    gsap.to(nextIconEl.value, {
      y: 0,
      opacity: 1,
      duration,
      ease: "power2.inOut",
      onComplete: () => {
        displayIndex.value = newIndex;
        gsap.set(currentIconEl.value, { y: 0, opacity: 1 });
        gsap.set(nextIconEl.value, { y: 40, opacity: 0 });
        isAnimating.value = false;
      },
    });
  };

  const handleMouseDown = (): void => {
    gsap.to(actionButton.value, { scale: 0.92, duration: 0.05, ease: "power2.out" });
  };

  const handleMouseUp = (): void => {
    gsap.to(actionButton.value, { scale: 1, duration: 0.08, ease: "back.out(2)" });
  };

  const handleClick = (): void => {
    applyContainerStyles(floatingActionContainer.value);
    const action = ICONS[currentIndex.value];
    if (EVENT_MAP[action]) emit(EVENT_MAP[action]);
  };

  const showScrollHint = (): void => {
    const hint = document.createElement("div");
    hint.className = "scroll-hint";
    hint.innerHTML = `<div class="scroll-hint-content"><div class="scroll-hint-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="5" ry="5"/><line x1="12" y1="6" x2="12" y2="10"/></svg></div><div class="scroll-hint-text">${t("floatingButton.scrollHint")}</div></div>`;
    document.body.appendChild(hint);
    gsap.fromTo(
      hint,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        delay: 0.5,
        ...GSAP_DEFAULTS,
        onComplete: () => {
          gsap.to(hint, {
            opacity: 0,
            y: 20,
            duration: 0.5,
            delay: 3,
            ease: "power2.in",
            force3D: false,
            immediateRender: false,
            onComplete: () => hint.remove(),
          });
        },
      },
    );
  };

  const onMountedHandler = (): void => {
    const container = floatingActionContainer.value;
    if (container) {
      gsap.set(container, { opacity: 0, scale: 0.8, y: 20 });
      applyContainerStyles(container, { "z-index": "10000", isolation: "isolate" });
    }
    if (currentIconEl.value) gsap.set(currentIconEl.value, { y: 0, opacity: 1 });
    if (nextIconEl.value) gsap.set(nextIconEl.value, { y: 40, opacity: 0 });
    if (tooltip.value) gsap.set(tooltip.value, { opacity: 0, y: 10, visibility: "hidden" });
    if (shouldRender.value && isHomePage.value) nextTick(() => setTimeout(showFloatingButton, 100));
    if (!storage.getItem("fabScrollHintShown") && shouldRender.value && isHomePage.value) {
      setTimeout(showScrollHint, 1000);
      storage.setItem("fabScrollHintShown", "true");
    }
  };

  const onUnmountedHandler = (): void => {
    clearTooltipTimer();
  };

  watch(isHomePage, (newVal: boolean, oldVal: boolean) => {
    if (newVal === oldVal) return;
    if (newVal) {
      shouldRender.value = true;
      isVisible.value = true;
      nextTick(() => setTimeout(showFloatingButton, 100));
    } else {
      isVisible.value = false;
      hideFloatingButton();
    }
  });

  return {
    actionButton,
    currentIconEl,
    nextIconEl,
    tooltip,
    floatingActionContainer,
    currentIndex,
    displayIndex,
    nextDisplayIndex,
    isHovered,
    isAnimating,
    isHomePage,
    shouldRender,
    isVisible,
    displayIcon,
    nextIcon,
    getCurrentTooltip,
    handleMouseEnter,
    handleMouseLeave,
    handleWheel,
    handleMouseDown,
    handleMouseUp,
    handleClick,
    onMountedHandler,
    onUnmountedHandler,
  };
}
