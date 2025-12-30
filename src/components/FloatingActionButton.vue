<template>
  <teleport to="body">
    <div
      v-if="isVisible"
      class="floating-action-container"
      ref="floatingActionContainer"
      :class="$attrs.class"
    >
      <div
        class="action-button"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
        @wheel="handleWheel"
        @click="handleClick"
        ref="actionButton"
      >
        <!-- 主要图标 -->
        <div class="icon-wrapper main-icon" ref="mainIcon">
          <font-awesome-icon :icon="['fas', getCurrentIcon]" />
        </div>

        <!-- 功能提示 -->
        <div class="function-tooltip" ref="tooltip">
          <span class="tooltip-text">{{ getCurrentTooltip }}</span>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { gsap } from "gsap";

// 禁用自动属性继承，因为我们使用teleport
defineOptions({
  inheritAttrs: false,
});

const { t } = useI18n({ useScope: "global" });
const route = useRoute();

const emit = defineEmits(["search-click", "folder-click", "refresh-click"]);

// 检查当前是否在Home页面（存档列表页面）
const isHomePage = computed(() => {
  return route.name === "Home";
});

// 显示状态控制
const isVisible = ref(isHomePage.value);

// 监听路由变化，动态显示/隐藏按钮
watch(isHomePage, (newValue, oldValue) => {
  console.log(`路由变化检测：${oldValue} -> ${newValue}`);
  if (newValue !== oldValue) {
    if (newValue) {
      // 切换到Home页面，立即显示按钮
      isVisible.value = true;
      // 确保DOM更新后再执行动画
      nextTick(() => {
        // 减少延迟时间，立即执行动画
        setTimeout(() => {
          console.log("切换到Home页面，显示浮动按钮");
          showFloatingButton();
        }, 10); // 减少到10ms
      });
    } else {
      // 切换到其他页面，隐藏按钮
      console.log("切换到其他页面，隐藏浮动按钮");
      hideFloatingButton();
    }
  }
});

// 显示浮动按钮动画
const showFloatingButton = () => {
  console.log("showFloatingButton被调用");

  if (!floatingActionContainer.value) {
    console.log("容器不存在，延迟100ms后重试");
    setTimeout(showFloatingButton, 100);
    return;
  }

  console.log("开始执行显示动画");

  try {
    // 设置初始状态（如果尚未设置）
    floatingActionContainer.value.style.visibility = "hidden";
    floatingActionContainer.value.style.opacity = "0";
    floatingActionContainer.value.style.transform =
      "scale(0.8) translateY(20px)";

    // 使用requestAnimationFrame确保流畅的动画
    requestAnimationFrame(() => {
      // 修正CSS中定义的容器类名
      floatingActionContainer.value.classList.add("floating-action-container");

      // 显示元素并应用动画 - 依赖CSS过渡
      floatingActionContainer.value.style.visibility = "visible";
      floatingActionContainer.value.style.opacity = "1";
      floatingActionContainer.value.style.transform = "scale(1) translateY(0)";
    });

    console.log("CSS过渡动画执行完成");
  } catch (error) {
    console.error("显示动画执行失败:", error);
    // 最终备用方案：直接显示
    floatingActionContainer.value.style.setProperty(
      "opacity",
      "1",
      "important"
    );
    floatingActionContainer.value.style.setProperty(
      "visibility",
      "visible",
      "important"
    );
    floatingActionContainer.value.style.setProperty(
      "transform",
      "scale(1) translateY(0)",
      "important"
    );
  }
};

// 隐藏浮动按钮动画
const hideFloatingButton = () => {
  if (!floatingActionContainer.value) return;

  console.log("开始执行隐藏动画");

  try {
    // 使用CSS过渡效果 - 直接修改样式，由CSS处理过渡
    floatingActionContainer.value.style.opacity = "0";
    floatingActionContainer.value.style.transform =
      "scale(0.8) translateY(20px)";
    floatingActionContainer.value.style.visibility = "hidden";

    // 动画完成后设置标志位
    setTimeout(() => {
      isVisible.value = false;
    }, 400); // 等待动画完成（400ms，与CSS过渡时间一致）

    console.log("CSS过渡隐藏动画执行完成");
  } catch (error) {
    console.error("隐藏动画执行失败:", error);
    // 备用方案：直接隐藏
    isVisible.value = false;
  }
};

const actionButton = ref(null);
const mainIcon = ref(null);
const tooltip = ref(null);
const floatingActionContainer = ref(null);

const icons = ["search", "folder", "refresh"];
const currentIndex = ref(0);
const isHovered = ref(false);

const getCurrentIcon = computed(() => {
  switch (icons[currentIndex.value]) {
    case "search":
      return "magnifying-glass";
    case "folder":
      return "folder";
    case "refresh":
      return "arrow-rotate-right";
    default:
      return "magnifying-glass";
  }
});

const getCurrentTooltip = computed(() => {
  switch (icons[currentIndex.value]) {
    case "search":
      return t("floatingButton.searchArchive");
    case "folder":
      return t("floatingButton.openFolder");
    case "refresh":
      return t("floatingButton.refreshList");
    default:
      return t("floatingButton.searchArchive");
  }
});

let tooltipTimer = null;

const handleMouseEnter = () => {
  isHovered.value = true;

  // 清除之前的定时器
  if (tooltipTimer) {
    clearTimeout(tooltipTimer);
    tooltipTimer = null;
  }

  // 取消可能正在进行的隐藏动画
  gsap.killTweensOf(tooltip.value);

  // 设置延迟显示，避免快速移动时的闪烁
  tooltipTimer = setTimeout(() => {
    // 确保鼠标仍在按钮上且tooltip元素存在
    if (isHovered.value && tooltip.value) {
      // 显示功能提示 - 优化性能
      gsap.to(tooltip.value, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
        // 优化性能：减少GPU负载
        force3D: false,
        // 使用更高效的渲染路径
        immediateRender: false,
      });
    }
  }, 100); // 100ms延迟
};

const handleMouseLeave = () => {
  isHovered.value = false;

  // 清除之前的定时器
  if (tooltipTimer) {
    clearTimeout(tooltipTimer);
    tooltipTimer = null;
  }

  // 取消可能正在进行的显示动画
  gsap.killTweensOf(tooltip.value);

  // 设置延迟隐藏，避免快速移动时的闪烁
  tooltipTimer = setTimeout(() => {
    // 确保鼠标已离开按钮且tooltip元素存在
    if (!isHovered.value && tooltip.value) {
      // 隐藏功能提示 - 优化性能
      gsap.to(tooltip.value, {
        opacity: 0,
        y: 10,
        duration: 0.2,
        ease: "power2.out",
        // 优化性能：减少GPU负载
        force3D: false,
        // 使用更高效的渲染路径
        immediateRender: false,
      });
    }
  }, 150); // 150ms延迟
};

const handleWheel = (event) => {
  event.preventDefault();

  // 取消当前可能正在进行的动画
  gsap.killTweensOf(mainIcon.value);

  if (event.deltaY > 0) {
    // 向下滚动
    currentIndex.value = (currentIndex.value + 1) % icons.length;
  } else {
    // 向上滚动
    currentIndex.value = (currentIndex.value - 1 + icons.length) % icons.length;
  }

  // 苹果时钟滚轮效果
  const direction = event.deltaY > 0 ? 1 : -1;
  const velocity = Math.abs(event.deltaY) / 100; // 根据滚动速度调整

  // 显示滚动提示 - 优化性能
  gsap.to(tooltip.value, {
    opacity: 1,
    y: 0,
    duration: 0.2,
    ease: "power2.out",
    // 优化性能：减少GPU负载
    force3D: false,
    // 使用更高效的渲染路径
    immediateRender: false,
  });

  // 创建滚轮滑动效果，带有惯性 - 优化性能
  gsap.to(mainIcon.value, {
    y: -direction * 40 * Math.min(velocity, 2),
    opacity: 0,
    duration: 0.15,
    ease: "power2.out",
    // 优化性能：减少GPU负载
    force3D: false,
    // 使用更高效的渲染路径
    immediateRender: false,
    onComplete: () => {
      // 瞬间切换图标位置到底部（不可见）
      gsap.set(mainIcon.value, { y: direction * 40, opacity: 0 });

      // 平滑滑动到新位置，带有弹性 - 优化性能
      gsap.to(mainIcon.value, {
        y: 0,
        opacity: 1,
        duration: 0.3,
        ease: "back.out(1.2)",
        // 优化性能：减少GPU负载
        force3D: false,
        // 使用更高效的渲染路径
        immediateRender: false,
      });
    },
  });
};

const handleClick = () => {
  // 点击动画 - 优化性能
  gsap.to(actionButton.value, {
    scale: 0.95,
    duration: 0.1,
    ease: "power2.out",
    // 优化性能：减少GPU负载
    force3D: false,
    // 使用更高效的渲染路径
    immediateRender: false,
    onComplete: () => {
      gsap.to(actionButton.value, {
        scale: 1,
        duration: 0.1,
        ease: "power2.out",
        // 优化性能：减少GPU负载
        force3D: false,
        // 使用更高效的渲染路径
        immediateRender: false,
      });
    },
  });

  // 确保容器位置在点击后保持不变
  const container = floatingActionContainer.value;
  if (container) {
    // 强制重置容器位置，防止任何可能的位移
    container.style.setProperty("position", "fixed", "important");
    container.style.setProperty("bottom", "30px", "important");
    container.style.setProperty("right", "30px", "important");
    container.style.setProperty("top", "auto", "important");
    container.style.setProperty("left", "auto", "important");
    container.style.setProperty("transform", "none", "important");
    container.style.setProperty("margin", "0", "important");
    container.style.setProperty("padding", "0", "important");

    // 延迟检查，确保在所有事件处理后位置仍然正确
    setTimeout(() => {
      container.style.setProperty("position", "fixed", "important");
      container.style.setProperty("bottom", "30px", "important");
      container.style.setProperty("right", "30px", "important");
      container.style.setProperty("top", "auto", "important");
      container.style.setProperty("left", "auto", "important");
      container.style.setProperty("transform", "none", "important");
      container.style.setProperty("margin", "0", "important");
      container.style.setProperty("padding", "0", "important");
    }, 100);

    // 额外的延迟检查，确保在所有布局变化后位置仍然正确
    setTimeout(() => {
      container.style.setProperty("position", "fixed", "important");
      container.style.setProperty("bottom", "30px", "important");
      container.style.setProperty("right", "30px", "important");
      container.style.setProperty("top", "auto", "important");
      container.style.setProperty("left", "auto", "important");
      container.style.setProperty("transform", "none", "important");
      container.style.setProperty("margin", "0", "important");
      container.style.setProperty("padding", "0", "important");
    }, 500);
  }

  // 触发对应操作
  const currentAction = icons[currentIndex.value];

  switch (currentAction) {
    case "search":
      emit("search-click");
      break;
    case "folder":
      emit("folder-click");
      break;
    case "refresh":
      emit("refresh-click");
      break;
    default:
      console.log(`执行操作: ${currentAction}`);
  }
};

// 显示滚动提示
const showScrollHint = () => {
  // 创建提示元素
  const hint = document.createElement("div");
  hint.className = "scroll-hint";
  hint.innerHTML = `
    <div class="scroll-hint-content">
      <div class="scroll-hint-icon">🖱️</div>
      <div class="scroll-hint-text">${t("floatingButton.scrollHint")}</div>
    </div>
  `;
  document.body.appendChild(hint);

  // 动画显示提示 - 优化性能
  gsap.fromTo(
    hint,
    { opacity: 0, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power2.out",
      delay: 0.5,
      // 优化性能：减少GPU负载
      force3D: false,
      // 使用更高效的渲染路径
      immediateRender: false,
      onComplete: () => {
        // 3秒后自动隐藏 - 优化性能
        gsap.to(hint, {
          opacity: 0,
          y: 20,
          duration: 0.5,
          delay: 3,
          ease: "power2.in",
          // 优化性能：减少GPU负载
          force3D: false,
          // 使用更高效的渲染路径
          immediateRender: false,
          onComplete: () => {
            document.body.removeChild(hint);
          },
        });
      },
    }
  );
};

onMounted(() => {
  // 确保浮动按钮容器样式不被外部修改
  const container = floatingActionContainer.value;
  if (container) {
    // 使用内联样式确保最高优先级
    container.style.setProperty("position", "fixed", "important");
    container.style.setProperty("bottom", "30px", "important");
    container.style.setProperty("right", "30px", "important");
    container.style.setProperty("z-index", "10000", "important");
    container.style.setProperty("top", "auto", "important");
    container.style.setProperty("left", "auto", "important");
    container.style.setProperty("transform", "none", "important");
    container.style.setProperty("isolation", "isolate", "important");
    container.style.setProperty("visibility", "visible", "important");
    container.style.setProperty("opacity", "1", "important");

    // 添加样式变化监听，但只在检测到关键样式被修改时才恢复
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "style"
        ) {
          // 获取当前样式
          const currentStyles = container.style;

          // 只检查关键定位属性
          const criticalStyles = [
            "position",
            "bottom",
            "right",
            "top",
            "left",
            "opacity",
            "visibility",
          ];
          let hasCriticalChanges = false;

          // 检查关键定位样式是否被意外修改
          criticalStyles.forEach((prop) => {
            const currentValue = currentStyles.getPropertyValue(prop);
            let expectedValue = "";

            if (prop === "position") {
              expectedValue = "fixed";
            } else if (prop === "bottom" || prop === "right") {
              expectedValue = "30px";
            } else if (prop === "top" || prop === "left") {
              expectedValue = "auto";
            } else if (prop === "opacity") {
              expectedValue = "1";
            } else if (prop === "visibility") {
              expectedValue = "visible";
            }

            if (currentValue && currentValue !== expectedValue) {
              hasCriticalChanges = true;
            }
          });

          // 只有检测到关键定位样式被修改时才恢复
          if (hasCriticalChanges) {
            console.log("检测到浮动按钮定位样式被修改，正在恢复...");
            container.style.setProperty("position", "fixed", "important");
            container.style.setProperty("bottom", "30px", "important");
            container.style.setProperty("right", "30px", "important");
            container.style.setProperty("top", "auto", "important");
            container.style.setProperty("left", "auto", "important");
            container.style.setProperty("opacity", "1", "important");
            container.style.setProperty("visibility", "visible", "important");
          }
        }
      });
    });

    observer.observe(container, {
      attributes: true,
      attributeFilter: ["style"],
    });
  }

  // 初始化tooltip状态
  gsap.set(tooltip.value, {
    opacity: 0,
    y: 10,
    visibility: "hidden",
    // 优化性能：减少GPU负载
    force3D: false,
    // 使用更高效的渲染路径
    immediateRender: true,
  });

  // 立即显示按钮（如果当前在Home页面）
  const initializeFloatingButton = () => {
    console.log(
      "初始化浮动按钮 - isVisible:",
      isVisible.value,
      "isHomePage:",
      isHomePage.value
    );
    if (isVisible.value && isHomePage.value) {
      console.log("执行显示动画");

      // 直接调用显示动画函数，确保动画效果
      showFloatingButton();

      console.log("浮动按钮淡入动画已启动");
    } else {
      console.log("不满足显示条件，跳过初始化");
    }
  };

  // 确保DOM完全加载后再初始化
  nextTick(() => {
    initializeFloatingButton();
  });

  // 显示滚动提示（仅在第一次使用时显示）
  if (
    !localStorage.getItem("fabScrollHintShown") &&
    isVisible.value &&
    isHomePage.value
  ) {
    setTimeout(() => {
      showScrollHint();
    }, 1000); // 减少延迟时间
    localStorage.setItem("fabScrollHintShown", "true");
  }
});

onUnmounted(() => {
  // 清理定时器防止内存泄漏
  if (tooltipTimer) {
    clearTimeout(tooltipTimer);
    tooltipTimer = null;
  }
});
</script>

<style scoped>
/* 浮动按钮容器 - 终极固定定位解决方案 */
.floating-action-container {
  /* 使用CSS的position: fixed并确保相对于视口定位 */
  position: fixed !important;
  bottom: 30px !important;
  right: 30px !important;
  z-index: 10000 !important;

  /* 确保相对于视口定位 */
  top: auto !important;
  left: auto !important;

  /* 防止任何变换影响 */
  transform: none !important;
  transform-origin: center center !important;

  /* 创建新的堆叠上下文 */
  isolation: isolate;

  /* 确保不被裁剪 */
  clip: auto !important;
  clip-path: none !important;

  /* 移除所有可能影响定位的属性 */
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;

  /* 保留will-change用于动画性能优化 */
  will-change: transform, opacity, scale;
  backface-visibility: hidden !important;
  perspective: 1000px !important;

  /* 确保GPU加速 */
  transform: translateZ(0);

  /* 添加完整的过渡属性，确保所有变化都有过渡 */
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  /* 确保初始状态正确 - 初始隐藏 */
  visibility: hidden;
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.action-button {
  position: relative;
  width: var(--fab-size, 60px) !important;
  height: var(--fab-size, 60px) !important;
  min-width: var(--fab-size, 60px) !important;
  min-height: var(--fab-size, 60px) !important;
  max-width: var(--fab-size, 60px) !important;
  max-height: var(--fab-size, 60px) !important;
  border-radius: 50%;
  background: var(--glass-bg, rgba(255, 255, 255, 0.1));
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.2));
  color: var(--accent-color, #007aff);
  cursor: pointer;
  transition: var(--card-transition);
  display: flex !important;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  box-sizing: border-box !important;

  /* 防止继承父元素的字体大小 */
  font-size: 0 !important;

  /* 确保初始布局稳定 */
  contain: layout style paint;
  will-change: transform, opacity;

  /* 添加完整的过渡属性，确保所有变化都有过渡 */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-button:hover {
  background: var(--sidebar-item-hover-bg, var(--bg-tertiary));
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  transform: var(--card-hover-transform);
}

.icon-wrapper {
  position: absolute;
  color: var(--accent-color, #007aff);
  font-size: 24px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  width: 24px !important;
  height: 24px !important;
  /* 确保图标加载时不会改变尺寸 */
  min-width: 24px !important;
  min-height: 24px !important;
  line-height: 1 !important;
}

.main-icon {
  position: relative;
  color: var(--accent-color, #007aff);
  font-size: 24px !important;
  width: 24px !important;
  height: 24px !important;
}

.function-tooltip {
  position: absolute;
  top: -45px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--glass-bg);
  backdrop-filter: var(--glass-backdrop-filter);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: var(--radius-tooltip);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  z-index: 1001;
  box-shadow: var(--card-shadow);
  border: var(--card-border);

  /* 确保tooltip初始状态正确 */
  visibility: hidden;
  opacity: 0;
}

.function-tooltip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: var(--glass-bg);
}

/* 滚动提示样式 */
.scroll-hint {
  position: fixed;
  bottom: 120px;
  right: 30px;
  z-index: 10000;
  pointer-events: none;
}

.scroll-hint-content {
  display: flex;
  align-items: center;
  background: var(--glass-bg);
  backdrop-filter: var(--glass-backdrop-filter);
  color: var(--text-primary);
  padding: 12px 16px;
  border-radius: var(--radius-xl);
  font-size: 14px;
  font-weight: 500;
  box-shadow: var(--card-shadow);
  border: var(--card-border);
}

.scroll-hint-icon {
  margin-right: 8px;
  font-size: 16px;
}

.scroll-hint-text {
  white-space: nowrap;
}

/* 深色模式支持 - 已通过variables.css变量实现，无需重复定义 */

/* 响应式设计 */
@media (max-width: 768px) {
  .floating-action-container {
    bottom: 20px !important;
    right: 20px !important;
    --fab-size: 56px;
  }

  .action-button {
    width: var(--fab-size, 56px) !important;
    height: var(--fab-size, 56px) !important;
    min-width: var(--fab-size, 56px) !important;
    min-height: var(--fab-size, 56px) !important;
    max-width: var(--fab-size, 56px) !important;
    max-height: var(--fab-size, 56px) !important;
  }

  .main-icon {
    font-size: 22px !important;
  }
}

/* 更小屏幕的适配 */
@media (max-width: 480px) {
  .floating-action-container {
    bottom: 15px !important;
    right: 15px !important;
    --fab-size: 50px;
  }

  .action-button {
    width: var(--fab-size, 50px) !important;
    height: var(--fab-size, 50px) !important;
    min-width: var(--fab-size, 50px) !important;
    min-height: var(--fab-size, 50px) !important;
    max-width: var(--fab-size, 50px) !important;
    max-height: var(--fab-size, 50px) !important;
  }

  .main-icon {
    font-size: 20px !important;
  }
}
</style>
