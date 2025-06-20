<template>
  <Search :light-mode="lightMode ? true : false" />
  <div class="glass-scroll-container">
    <div class="glass-scroll-content">
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
import Card from "../components/LG_Card.vue";
import Search from "../components/LG_Search.vue";
import { notify } from "../services/notificationManager.js";
import { invoke } from "@tauri-apps/api/core";

export default {
  components: {
    Card,
    Search,
  },
  data() {
    return {
      lightMode: true,
      archives: [], // 初始化为空数组
    };
  },
  async mounted() {
    await this.loadSaves();
  },
  methods: {
    async loadTranslations() {
      try {
        const response = await fetch("/locales/zh-CN/zh-CN.json");
        if (!response.ok) {
          notify.error({
            title: "加载失败",
            message: "无法加载语言文件。",
            position: "top-right",
          });
          throw new Error("无法加载语言文件");
        }
        const translations = await response.json();
        return translations;
      } catch (err) {
        console.error("加载语言文件失败:", err);
        return {};
      }
    },
    async loadSaves() {
      try {
        const [saves, translations] = await Promise.all([
          invoke("load_all_saves"),
          this.loadTranslations(),
        ]);

        const levelNames = translations?.LevelName || {};

        this.archives = saves.map((save) => ({
          id: save.id,
          name: save.name,
          difficulty: save.difficulty,
          difficultyClass: save.difficulty_class,
          setDifficulty: save.difficulty,
          actualDifficulty: save.actual_difficulty,
          mode: save.mode,
          date: save.date,
          currentLevel: levelNames[save.current_level] || save.current_level,
          hidden: save.hidden,
        }));

        // 在数据加载完成后显示通知
        notify.success({
          title: "操作成功",
          message: "您的设置已成功保存",
          position: "top-right",
        });
      } catch (err) {
        console.error("加载失败:", err);
      }
    },
    async handleDelete(archiveId) {
      notify.success({
        title: "操作成功",
        message: "您的设置已成功保存",
        position: "top-right",
      });
    },
    handleEdit(archiveId) {
      // 处理编辑逻辑
    },
    handleToggle(archiveId) {
      notify.success({
        title: "操作成功",
        message: "您的设置已成功保存",
        position: "top-right",
      });
    },
  },
};
</script>

<style scoped>
.cards-container {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
  width: 85%;
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
}

.glass-scroll-content {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding-right: 20px;
  border-radius: 20px;
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
