<template>
  <Search :light-mode="lightMode ? true : false" ref="searchButtonRef" />
  <div class="glass-scroll-container">
    <div class="glass-scroll-content" ref="glassScrollContentRef">
      <div class="cards-container" :data-theme="lightMode ? 'light' : 'dark'">
        <Card
          v-for="archive in archives"
          :key="archive.id"
          :archive="archive"
          :lightMode="lightMode"
          @delete="handleDelete"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";
import gsap from "gsap";
import Card from "../components/LG_Card.vue";
import Search from "../components/LG_Search.vue";
import { invoke } from "@tauri-apps/api/core";

export default {
  components: {
    Card,
    Search,
  },
  setup() {
    const lightMode = ref(true);
    const archives = ref([]);
    const searchButtonRef = ref(null);
    const glassScrollContentRef = ref(null); // ✅ 添加这一行，修复报错

    const loadTranslations = async () => {
      try {
        const response = await fetch("/locales/zh-CN/zh-CN.json");
        if (!response.ok) throw new Error("无法加载语言文件");
        return await response.json();
      } catch (err) {
        console.error("加载语言文件失败:", err);
        return {};
      }
    };

    const loadSaves = async () => {
      try {
        const [saves, translations] = await Promise.all([
          invoke("load_all_saves"),
          loadTranslations(),
        ]);

        const levelNames = translations?.LevelName || {};

        archives.value = saves.map((save) => ({
          id: save.id,
          name: save.name,
          difficulty: save.difficulty,
          difficultyClass: save.difficulty_class,
          actualDifficulty: save.actual_difficulty,
          mode: save.mode,
          date: save.date,
          currentLevel: levelNames[save.current_level] || save.current_level,
          hidden: save.hidden,
        }));
      } catch (err) {
        console.error("加载失败:", err);
      }
    };

    const handleDelete = (archiveId) => {};

    const handleScroll = () => {
      const container = glassScrollContentRef.value;
      if (!container) return;

      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;

      const bottomThreshold = scrollHeight - clientHeight * 1.15;

      if (searchButtonRef.value && searchButtonRef.value.$el) {
        const buttonEl = searchButtonRef.value.$el;

        if (scrollTop >= bottomThreshold) {
          gsap.to(buttonEl, {
            duration: 0.3,
            scale: 0.7,
            y: -40,
            opacity: 0.8,
            ease: "power2.out",
          });
        } else {
          gsap.to(buttonEl, {
            duration: 0.3,
            scale: 1,
            y: 0,
            opacity: 1,
            ease: "power2.out",
          });
        }
      }
    };

    onMounted(async () => {
      await loadSaves();

      if (glassScrollContentRef.value) {
        glassScrollContentRef.value.addEventListener("scroll", handleScroll);
      }
    });

    onUnmounted(() => {
      if (glassScrollContentRef.value) {
        glassScrollContentRef.value.removeEventListener("scroll", handleScroll);
      }
    });

    return {
      lightMode,
      archives,
      loadSaves,
      handleDelete,
      searchButtonRef,
    };
  },
};
</script>

<style scoped>
.card {
  position: relative;
  left: 10px;
}

.cards-container {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  width: 90%;
  height: 90vh;
  margin: 0 auto;
  padding: 20px;
  justify-content: center;
  align-items: start;
  background-color: #d4dde5;
  color: #111827;
  border-radius: 37px;
  overflow-y: auto;
  position: relative;
  z-index: 1;
  clip-path: inset(0 round 20px);
}

.glass-scroll-content {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding-right: 20px;
  border-radius: 20px;
  clip-path: inset(0 round 20px);
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'%3E%3Crect x='0' y='0' width='100%' height='100%' rx='20' ry='20' fill='white'/%3E%3C/svg%3E")
    no-repeat center / contain;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'%3E%3Crect x='0' y='0' width='100%' height='100%' rx='20' ry='20' fill='white'/%3E%3C/svg%3E")
    no-repeat center / contain;
  mask-composite: add;
  -webkit-mask-composite: source-in;
}
</style>

<style>
.glass-scroll-container {
  position: relative;
  overflow: hidden;
  border-radius: var(--Home-container-border-radius);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.light-mode {
  --Home-scrollbar-thumb-color: rgba(102, 126, 234, 0.5);
  --Home-scrollbar-track-color: rgba(0, 0, 0, 0.05);
  --Home-scrollbar-hover-color: rgba(102, 126, 234, 0.8);
}

.glass-scroll-content::-webkit-scrollbar {
  width: var(--Home-scrollbar-width);
}

.glass-scroll-content::-webkit-scrollbar-track {
  background: var(--Home-scrollbar-track-color);
  border-radius: var(--Home-scrollbar-border-radius);
}

.glass-scroll-content::-webkit-scrollbar-thumb {
  background: var(--Home-scrollbar-thumb-color);
  border-radius: var(--Home-scrollbar-border-radius);
  background-clip: padding-box;
  transition: all 0.3s ease;
}

.glass-scroll-content::-webkit-scrollbar-thumb:hover {
  background: var(--Home-scrollbar-hover-color);
}

.glass-scroll-content {
  scrollbar-width: thin;
  scrollbar-color: var(--Home-scrollbar-thumb-color)
    var(--Home-scrollbar-track-color);
}
</style>
