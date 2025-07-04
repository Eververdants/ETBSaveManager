<template>
  <div
    class="glass-sidebar"
    :class="{ expanded: isExpanded, 'dark-theme': isDark }"
    @mouseenter="isExpanded = true"
    @mouseleave="isExpanded = false"
  >
    <!-- 顶部菜单 -->
    <div class="menu-section top-menu">
      <a
        class="menu-item"
        :class="{ active: activeItem === 'archive' }"
        @click="setActive('archive')"
      >
        <i class="fas fa-archive"></i>
        <span class="menu-text">存档列表</span>
      </a>
      <a
        class="menu-item"
        :class="{ active: activeItem === 'new' }"
        @click="setActive('new')"
      >
        <i class="fas fa-plus-circle"></i>
        <span class="menu-text">新建存档</span>
      </a>
      <a
        class="menu-item"
        :class="{ active: activeItem === 'expand' }"
        @click="setActive('expand')"
      >
        <i class="fas fa-box-open"></i>
        <span class="menu-text">拓展内容</span>
      </a>
    </div>

    <!-- 底部菜单 -->
    <div class="menu-section bottom-menu">
      <a
        class="menu-item"
        :class="{ active: activeItem === 'about' }"
        @click="setActive('about')"
      >
        <i class="fas fa-info-circle"></i>
        <span class="menu-text">关于</span>
      </a>
      <a
        class="menu-item"
        :class="{ active: activeItem === 'howto' }"
        @click="setActive('howto')"
      >
        <i class="fas fa-question-circle"></i>
        <span class="menu-text">如何使用</span>
      </a>
      <a
        class="menu-item"
        :class="{ active: activeItem === 'settings' }"
        @click="setActive('settings')"
      >
        <i class="fas fa-cog"></i>
        <span class="menu-text">设置</span>
      </a>
    </div>
  </div>
</template>

<script>
import { gsap } from "gsap";

export default {
  name: "LivingGlassSidebar",
  data() {
    return {
      isExpanded: false,
      isDark: false,
      activeItem: "archive",
    };
  },
  methods: {
    toggleSidebar() {
      this.isExpanded = !this.isExpanded;

      // 使用GSAP创建更流畅的动画
      const sidebar = this.$el;
      if (this.isExpanded) {
        gsap.to(sidebar, {
          width: 250,
          duration: 0.3,
          ease: "power2.out",
        });
      } else {
        gsap.to(sidebar, {
          width: 60,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    },
    toggleTheme() {
      this.isDark = !this.isDark;
    },
    setActive(item) {
      this.activeItem = item;
      this.$emit("item-selected", item);
    },
  },
  mounted() {
    this.isExpanded = false;
  },
};
</script>

<style scoped>
.glass-sidebar {
  width: 60px;
  height: 100vh;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: hidden;
  position: fixed;
  z-index: 999;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  left: 0;
  bottom: 0;
}

.glass-sidebar.expanded {
  width: 250px;
}

.glass-sidebar::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.25),
    rgba(255, 255, 255, 0.1)
  );
  z-index: -1;
}

.glass-sidebar.dark-theme {
  background: rgba(30, 30, 50, 0.3);
  border-right: 1px solid rgba(0, 0, 0, 0.2);
}

.glass-sidebar.dark-theme::before {
  background: linear-gradient(
    135deg,
    rgba(20, 20, 40, 0.4),
    rgba(30, 30, 50, 0.2)
  );
}

/* 菜单项样式 */
.menu-section {
  display: flex;
  flex-direction: column;
  padding: 15px 0;
}

.top-menu {
  flex: 1;
}

.bottom-menu {
  margin-top: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  margin: 5px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #2c3e50;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
}

.glass-sidebar.dark-theme .menu-item {
  color: #e0e0ff;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateX(5px);
}

.glass-sidebar.dark-theme .menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.menu-item.active {
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 15px rgba(100, 150, 255, 0.3);
}

.glass-sidebar.dark-theme .menu-item.active {
  background: rgba(100, 100, 200, 0.3);
}

.menu-item i {
  font-size: 1.4rem;
  width: 24px; /* 减少宽度 */
  text-align: center;
  margin-right: 12px; /* 减少右边距 */
  transition: all 0.3s ease;
  flex-shrink: 0; /* 防止图标被压缩 */
}

.menu-text {
  font-size: 1.1rem;
  font-weight: 500;
  opacity: 0;
  transition: opacity 0.3s ease;
  transform: translateX(-10px);
}

.glass-sidebar.expanded .menu-text {
  opacity: 1;
  transform: translateX(0);
}

/* 收起状态时图标居中 */
.glass-sidebar:not(.expanded) .menu-item {
  padding: 15px 12px; /* 减少内边距 */
}

.glass-sidebar:not(.expanded) .menu-item i {
  margin-right: 0; /* 收起时移除右边距 */
}
</style>
