<template>
  <div class="archive-selector">
    <div class="cards-container">
      <div
        v-for="(key, index) in levelKeys"
        :key="key"
        class="card"
        @click="selectArchive(index)"
      >
        <div class="card-image">
          <img :src="getImageUrl(index)" alt="存档图片" />
        </div>
        <div class="card-name">
          <span>{{ getLevelName(index) }}</span>
        </div>
        <div class="card-action">
          <button>
            <i class="fas fa-check-circle"></i>
            <span>选择</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>加载存档中...</span>
    </div>

    <LG_CreateAModal
      v-model:show="showModal"
      :light-mode="true"
      @create="handleCreate"
      :level-key="selectedLevelKey"
      ref="modalRef"
    />
  </div>
</template>

<script>
import LG_CreateAModal from "../components/LG_CreateAModal.vue";

export default {
  name: "ArchiveSelector",
  components: {
    LG_CreateAModal,
  },
  data() {
    return {
      imagesMap: {}, // 存储 index -> image 映射
      levelKeys: [], // 存储所有层级 key
      loading: true,
      levelNames: {},
      showModal: false,
      selectedLevelKey: null,
    };
  },
  async mounted() {
    try {
      const response = await fetch("/locales/zh-CN/zh-CN.json");
      if (!response.ok) throw new Error("网络响应失败");
      const data = await response.json();
      this.levelNames = data.LevelName_Display;

      // 获取所有层级 key
      this.levelKeys = Object.keys(this.levelNames);

      // 预加载对应图片
      for (let i = 0; i < this.levelKeys.length; i++) {
        const imgUrl = `/images/${i}.jpg`;
        const exists = await this.imageExists(imgUrl);
        if (exists) {
          this.imagesMap[i] = imgUrl;
        }
      }

      console.log("levelKeys:", this.levelKeys);
    } catch (err) {
      console.error("加载失败:", err);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async loadImages() {
      this.loading = true;
      this.images = [];

      try {
        let index = 0;
        const loadedImages = [];

        while (index < 100) {
          const imgUrl = `/images/${index}.jpg`;
          const exists = await this.imageExists(imgUrl);

          if (exists) {
            loadedImages.push(imgUrl);
          } else {
            let missingCount = 0;
            for (let i = 1; i <= 5; i++) {
              const nextImg = `/images/${index + i}.jpg`;
              if (!(await this.imageExists(nextImg))) {
                missingCount++;
              }
            }
            if (missingCount >= 5) break;
          }

          index++;
        }

        this.images = loadedImages;
      } catch (error) {
        console.error("加载存档图片失败:", error);
      } finally {
        this.loading = false;
      }
    },

    getImageUrl(index) {
      return this.imagesMap[index] || "/images/default.jpg"; // 默认图可选
    },
    selectArchive(index) {
      if (index >= this.levelKeys.length) {
        alert("无效的层级，请刷新页面重试");
        return;
      }

      this.selectedLevelKey = this.levelKeys[index];
      this.showModal = true;
      document.body.classList.add("modal-open");
    },
    getLevelName(index) {
      return this.levelNames[this.levelKeys[index]] || `层级 #${index}`;
    },

    imageExists(url) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
      });
    },

    getLevelName(index) {
      const keys = Object.keys(this.levelNames);
      return keys[index] ? this.levelNames[keys[index]] : `层级 #${index}`;
    },

    selectArchive(index) {
      if (Object.keys(this.levelNames).length === 0) {
        alert("请稍等，层级数据正在加载...");
        return;
      }

      const keys = Object.keys(this.levelNames);
      this.selectedLevelKey = keys[index] || null;

      if (this.selectedLevelKey) {
        this.showModal = true;
        document.body.classList.add("modal-open");
      } else {
        alert("无效的层级，请刷新页面重试");
      }
    },

    handleCreate(data) {
      console.log("创建存档数据:", data);

      // 强制跳过动画关闭模态框
      this.$refs.modalRef?.closeModal({ skipAnimation: true });
    },
  },
};
</script>

<style scoped>
.dark-theme {
  --CreateArchive-bg-primary: #0f172a;
  --CreateArchive-text-primary: #f1f5f9;
  --CreateArchive-text-secondary: #94a3b8;
  --CreateArchive-accent-color: #60a5fa;
  --CreateArchive-accent-hover: #3b82f6;
  --CreateArchive-success-color: #34d399;
  --CreateArchive-card-bg: #1e293b;
  --CreateArchive-card-border: #334155;
  --CreateArchive-card-shadow: 0 4px 12px rgba(96, 165, 250, 0.15);
  --CreateArchive-card-shadow-hover: 0 6px 16px rgba(96, 165, 250, 0.3);
  --CreateArchive-loading-color: #60a5fa;
}

/* 基础样式 */
.archive-selector {
  width: 100%;
  height: 90vh;
  background-color: var(--CreateArchive-bg-primary);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
}

.cards-container {
  width: 90%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  overflow-y: auto;
  padding: 10px;
}

.card {
  display: flex;
  flex-direction: column;
  background-color: var(--CreateArchive-card-bg);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--CreateArchive-card-shadow);
  border: 1px solid var(--CreateArchive-card-border);
  transition: all 0.3s ease;
  cursor: pointer;
  height: 320px; /* 固定卡片高度 */
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: var(--CreateArchive-card-shadow-hover);
}

.card.selected {
  border: 2px solid var(--CreateArchive-success-color);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.card-image {
  height: 60%; /* 192px (320 * 0.6) */
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-name {
  height: 20%; /* 64px (320 * 0.2) */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border-bottom: 1px solid var(--CreateArchive-card-border);
}

.card-name span {
  color: var(--CreateArchive-text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
}

.card-action {
  height: 20%; /* 64px (320 * 0.2) */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
}

.card-action button {
  background-color: var(--CreateArchive-accent-color);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 20px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.card-action button:hover {
  background-color: var(--CreateArchive-accent-hover);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.card.selected .card-action button {
  background-color: var(--CreateArchive-success-color);
}

/* 加载状态 */
.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  color: var(--CreateArchive-text-primary);
  font-size: 1.1rem;
}

.loading i {
  font-size: 2rem;
  color: var(--CreateArchive-loading-color);
}

/* 无存档状态 */
.no-archives {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--CreateArchive-text-secondary);
}

.no-archives i {
  font-size: 3rem;
  margin-bottom: 15px;
  color: var(--CreateArchive-text-secondary);
}

.no-archives h3 {
  font-size: 1.5rem;
  margin-bottom: 10px;
  color: var(--CreateArchive-text-primary);
}

/* 滚动条样式 */
.cards-container::-webkit-scrollbar {
  width: 8px;
}

.cards-container::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.cards-container::-webkit-scrollbar-thumb {
  background: var(--CreateArchive-accent-color);
  border-radius: 4px;
}

.cards-container::-webkit-scrollbar-thumb:hover {
  background: var(--CreateArchive-accent-hover);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .cards-container {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}

@media (max-width: 768px) {
  .cards-container {
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 15px;
  }

  .card {
    height: 280px;
  }
}

@media (max-width: 480px) {
  .cards-container {
    grid-template-columns: 1fr;
    width: 95%;
  }

  .card {
    height: 300px;
  }
}
</style>
