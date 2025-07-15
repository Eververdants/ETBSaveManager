<template>
  <div
    class="sidebar"
    :class="{ expanded: isExpanded }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="menu-section top-menu">
      <a
        v-for="(item, index) in topMenuItems"
        :key="item.id"
        class="menu-item"
        :class="{ active: activeItem === item.id }"
        @click="setActive(item.id, index)"
        ref="menuItems"
      >
        <div class="menu-icon-wrapper">
          <i :class="item.icon"></i>
          <div class="ripple-effect" ref="ripples"></div>
        </div>
        <span class="menu-text">{{ item.text }}</span>
      </a>
    </div>

    <div class="divider" ref="divider"></div>

    <div class="menu-section bottom-menu">
      <a
        v-for="(item, index) in bottomMenuItems"
        :key="item.id"
        class="menu-item"
        :class="{ active: activeItem === item.id }"
        @click="setActive(item.id, index + topMenuItems.length)"
        ref="menuItems"
      >
        <div class="menu-icon-wrapper">
          <i :class="item.icon"></i>
          <div class="ripple-effect" ref="ripples"></div>
        </div>
        <span class="menu-text">{{ item.text }}</span>
      </a>
    </div>
  </div>
</template>

<script>
import { gsap } from "gsap";

export default {
  name: "Sidebar",
  data() {
    return {
      isExpanded: false,
      activeItem: "archive",
      isDarkTheme: false,
      topMenuItems: [
        { id: "archive", text: "存档列表", icon: "fas fa-archive" },
        { id: "new", text: "创建存档", icon: "fas fa-plus-circle" },
        { id: "expand", text: "插件市场", icon: "fas fa-box-open" },
      ],
      bottomMenuItems: [
        { id: "about", text: "关于", icon: "fas fa-info-circle" },
        { id: "howto", text: "如何使用", icon: "fas fa-question-circle" },
        { id: "settings", text: "设置", icon: "fas fa-cog" },
      ],
      timeline: null,
    };
  },
  mounted() {
    this.isExpanded = false;
    this.setupRippleEffects();

    // 创建展开/收起的时间轴动画
    this.timeline = gsap.timeline({ paused: true });

    // 文字动画
    this.timeline.to(
      ".menu-text",
      {
        opacity: 1,
        x: 0,
        duration: 0.3,
        stagger: 0.05,
        ease: "power2.out",
      },
      0
    );

    // 分隔线动画
    this.timeline.fromTo(
      this.$refs.divider,
      { scaleX: 0, opacity: 0 },
      { scaleX: 1, opacity: 1, duration: 0.3, ease: "power2.out" },
      0.1
    );
  },
  methods: {
    handleMouseEnter() {
      this.isExpanded = true;
      this.timeline.play();
    },
    handleMouseLeave() {
      this.isExpanded = false;
      this.timeline.reverse();
    },
    setActive(item, index) {
      this.activeItem = item;
      this.$emit("item-selected", item);
    },
    setupRippleEffects() {
      this.$refs.menuItems?.forEach((item, index) => {
        item.addEventListener("click", (e) => {
          const ripple = this.$refs.ripples?.[index];
          if (!ripple) return;

          // 移除之前的涟漪效果
          ripple.classList.remove("active");

          // 计算涟漪位置
          const rect = item.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          // 设置涟漪位置
          ripple.style.left = `${x}px`;
          ripple.style.top = `${y}px`;

          // 激活涟漪效果
          ripple.classList.add("active");

          // 动画结束后移除
          setTimeout(() => {
            ripple.classList.remove("active");
          }, 600);
        });
      });
    },
  },
};
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width-collapsed);
  height: 100vh;
  background: var(--Sidebar-color-surface);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  box-shadow: var(--Sidebar-elevation-2);
  border-radius: 0 var(--Sidebar-border-radius) var(--Sidebar-border-radius) 0;
  overflow: hidden;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: width;
}

.sidebar.expanded {
  width: var(--sidebar-width-expanded);
}

.menu-section {
  display: flex;
  flex-direction: column;
  padding: 12px 0;
}

.top-menu {
  flex: 1;
}

.divider {
  height: 1px;
  background: var(--Sidebar-color-divider);
  margin: 8px 16px;
  transform-origin: left center;
  transform: scaleX(0);
  opacity: 0;
}

.bottom-menu {
  margin-top: auto;
}

.menu-item {
  position: relative;
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0;
  margin: 4px 8px;
  border-radius: 12px;
  cursor: pointer;
  color: var(--Sidebar-color-on-surface);
  text-decoration: none;
  overflow: hidden;
  transition: var(--Sidebar-transition);
  will-change: transform, background;
  justify-content: center; /* 收起状态下居中 */
}

.sidebar.expanded .menu-item {
  justify-content: flex-start; /* 展开状态下左对齐 */
  padding: 0 16px;
}

.menu-item:hover {
  background: var(--Sidebar-color-hover);
}

.menu-item.active {
  background: var(--Sidebar-color-active);
  color: var(--Sidebar-color-primary);
}

.menu-item.active .menu-icon-wrapper i {
  color: var(--Sidebar-color-primary);
}

.menu-icon-wrapper {
  position: absolute;
  left: 0;
  top: 0;
  width: 55px;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.menu-icon-wrapper i {
  font-size: 1.25rem;
  transition: transform 0.3s ease, color 0.2s ease;
  z-index: 2;
}

.menu-item:hover .menu-icon-wrapper i {
  transform: scale(1.1);
}

.menu-item.active .menu-icon-wrapper i {
  transform: scale(1.15);
}

.menu-text {
  position: absolute;
  left: 40px;
  margin-left: 16px;
  font-size: 1rem;
  font-weight: 500;
  white-space: nowrap;
  transform: translateX(10px);
  width: 0;
  overflow: visible;
}

.ripple-effect {
  position: absolute;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(124, 77, 255, 0.2);
  transform: translate(-50%, -50%) scale(0);
  pointer-events: none;
  z-index: 0;
}

.ripple-effect.active {
  animation: ripple 0.6s ease-out;
}

@keyframes ripple {
  to {
    transform: translate(-50%, -50%) scale(4);
    opacity: 0;
  }
}

/* 性能优化 */
.sidebar,
.menu-item,
.menu-icon-wrapper,
.ripple-effect {
  will-change: transform, opacity, background;
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
}

@media (max-height: 600px) {
  .menu-item {
    height: 48px;
  }
}
</style>
