<template>
  <Transition name="menu" appear>
    <div
      v-if="show"
      class="item-menu"
      :class="{ 'light-mode': lightMode }"
      :style="menuStyle"
      ref="menuRef"
      @click.stop
    >
      <div class="menu-header">
        <h4>选择物品</h4>
        <button class="close-menu" @click="close">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="menu-search">
        <div class="search-wrapper">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索物品..."
            :class="{ 'light-mode': lightMode }"
            ref="searchInput"
            @click.stop
          />
        </div>
      </div>

      <div class="menu-items" ref="menuItems" @scroll.stop>
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="menu-item"
          @click="selectItem(item)"
        >
          <div
            class="item-icon"
            :style="{ backgroundImage: `url(${item.icon})` }"
          ></div>
          <span class="item-name">{{ item.name }}</span>
        </div>

        <div v-if="filteredItems.length === 0" class="no-results">
          没有找到匹配的物品
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import gsap from "gsap";

export default {
  props: {
    items: Array,
    position: {
      type: Object,
      default: () => ({ x: 0, y: 0 }), // 防止 undefined
    },
    lightMode: Boolean,
  },
  emits: ["select", "close"],
  setup(props, { emit }) {
    const show = ref(true);
    const searchQuery = ref("");
    const menuRef = ref(null);
    const searchInput = ref(null);

    // 计算菜单位置
    const menuStyle = computed(() => {
      return {
        left: `${props.position.x}px`,
        top: `${props.position.y}px`,
        position: "fixed",
        zIndex: 2000,
      };
    });

    // 过滤物品
    const filteredItems = computed(() => {
      if (!searchQuery.value) return props.items;
      const query = searchQuery.value.toLowerCase();
      return props.items.filter((item) =>
        item.name.toLowerCase().includes(query)
      );
    });

    // 选择物品
    const selectItem = (item) => {
      // 添加点击动画
      const element = event?.currentTarget;
      if (element) {
        gsap.fromTo(
          element,
          { scale: 0.95 },
          {
            scale: 1,
            duration: 0.3,
            ease: "elastic.out(1, 0.8)",
            onComplete: () => {
              emit("select", item);
              close();
            },
          }
        );
      } else {
        emit("select", item);
        close();
      }
    };

    // 关闭菜单
    const close = () => {
      gsap.to(menuRef.value, {
        opacity: 0,
        scale: 0.95,
        duration: 0.2,
        ease: "power2.in",
        onComplete: () => {
          show.value = false;
          emit("close");
        },
      });
    };

    // 动画效果
    onMounted(() => {
      if (menuRef.value) {
        gsap.fromTo(
          menuRef.value,
          { opacity: 0, scale: 0.95, y: 5 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.3,
            ease: "back.out(1.7)",
            delay: 0.1,
          }
        );
      }

      // 自动聚焦搜索框
      if (searchInput.value) {
        searchInput.value.focus();
      }
    });

    return {
      show,
      searchQuery,
      menuRef,
      searchInput,
      menuStyle,
      filteredItems,
      selectItem,
      close,
    };
  },
};
</script>

<style scoped>
.item-menu {
  position: fixed;
  background: rgba(30, 32, 45, 0.95);
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  z-index: 2000;
  width: 240px;
  max-height: 360px;
  overflow: hidden;
  border: 1px solid rgba(100, 110, 180, 0.3);
  transform-origin: top left;
  display: flex;
  flex-direction: column;
}

.item-menu.light-mode {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(120, 140, 220, 0.3);
}

.menu-header {
  padding: 12px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(50, 55, 80, 0.5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.item-menu.light-mode .menu-header {
  background: rgba(230, 235, 245, 0.8);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.menu-header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
  color: #d0d0ff;
}

.item-menu.light-mode .menu-header h4 {
  color: #34495e;
}

.close-menu {
  background: none;
  border: none;
  color: #a0a0c0;
  font-size: 16px;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-menu:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.item-menu.light-mode .close-menu {
  color: #7f8c8d;
}

.item-menu.light-mode .close-menu:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #2c3e50;
}

.menu-search {
  padding: 10px 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.item-menu.light-mode .menu-search {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.search-wrapper {
  position: relative;
}

.search-wrapper i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #7a89c9;
  font-size: 14px;
}

.search-wrapper input {
  width: 75%;
  padding: 10px 15px 10px 35px;
  background: rgba(40, 45, 60, 0.6);
  border: 1px solid rgba(100, 110, 180, 0.3);
  border-radius: 8px;
  color: #e0e0ff;
  font-size: 13px;
  transition: all 0.3s ease;
}

.search-wrapper input:focus {
  outline: none;
  border-color: #7a89c9;
  box-shadow: 0 0 0 2px rgba(100, 110, 180, 0.3);
}

.item-menu.light-mode .search-wrapper input {
  background: rgba(240, 242, 245, 0.8);
  border: 1px solid rgba(120, 140, 220, 0.3);
  color: #2c3e50;
}

.item-menu.light-mode .search-wrapper input:focus {
  border-color: #5a6da8;
  box-shadow: 0 0 0 2px rgba(120, 140, 220, 0.3);
}

.menu-items {
  flex: 1;
  max-height: 280px;
  overflow-y: auto;
  padding: 8px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-item:hover {
  background: rgba(100, 110, 180, 0.3);
}

.item-menu.light-mode .menu-item:hover {
  background: rgba(120, 140, 220, 0.2);
}

.item-icon {
  width: 32px;
  height: 32px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  margin-right: 12px;
  border-radius: 5px;
  background-color: rgba(0, 0, 0, 0.2);
}

.item-name {
  font-size: 14px;
  color: #d0d0ff;
  flex: 1;
}

.item-menu.light-mode .item-name {
  color: #34495e;
}

.no-results {
  padding: 15px;
  text-align: center;
  color: #a0a0d0;
  font-size: 13px;
}

.item-menu.light-mode .no-results {
  color: #7f8c8d;
}

/* 动画效果 */
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.2s ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
}

.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(5px) scale(0.95);
}
</style>
