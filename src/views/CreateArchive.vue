<template>
  <div class="archive-selector">
    <div class="header">
      <h1>选择层级</h1>
    </div>

    <div class="cards-container">
      <div v-for="(key, index) in levelKeys" :key="key" class="card-wrapper">
        <Transition appear @enter="enterCardAnimation" :css="false">
          <div
            v-show="getImageUrl(index)"
            class="card"
            @click="selectArchive(index)"
            :class="{ 'card-loading': !getImageUrl(index) }"
          >
            <div class="card-image">
              <div v-if="!getImageUrl(index)" class="image-placeholder">
                <i class="fas fa-spinner fa-spin"></i>
              </div>
              <img v-else :src="getImageUrl(index)" alt="存档图片" />
            </div>
            <div class="card-content">
              <div class="card-name">
                <span>{{ getLevelName(index) }}</span>
              </div>
            </div>
            <div class="card-action">
              <button class="ripple-button">
                <i class="fas fa-arrow-right"></i>
                <span>选择</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <LG_CreateAModal
      v-model:show="showModal"
      @create="handleCreate"
      :level-key="selectedLevelKey"
    />
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import LG_CreateAModal from "../components/LG_CreateAModal.vue";
import gsap from "gsap";

export default {
  name: "ArchiveSelector",
  components: {
    LG_CreateAModal,
  },
  setup() {
    const imagesMap = ref({});
    const levelKeys = ref([]);
    const levelNames = ref({});
    const showModal = ref(false);
    const selectedLevelKey = ref(null);

    // 加载语言文件
    async function loadLevelNames() {
      try {
        const response = await fetch("/locales/zh-CN/zh-CN.json");
        if (!response.ok) throw new Error("网络响应失败");
        const data = await response.json();
        levelNames.value = data.LevelName_Display;

        // 获取所有层级 key
        levelKeys.value = Object.keys(levelNames.value);

        // 开始异步加载每张图并逐步显示卡片
        for (let i = 0; i < levelKeys.value.length; i++) {
          const imgUrl = `/images/${i}.jpg`;
          const exists = await imageExists(imgUrl);
          if (exists) {
            // 使用数组索引作为键更新对象
            imagesMap.value[i] = imgUrl;
          }
        }
      } catch (err) {
        console.error("加载失败:", err);
      }
    }

    // 图片是否存在
    function imageExists(url) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
      });
    }

    // 获取图片路径
    function getImageUrl(index) {
      return imagesMap.value[index];
    }

    // 获取层级名称
    function getLevelName(index) {
      return levelNames.value[levelKeys.value[index]] || `层级 #${index + 1}`;
    }

    // 选择存档
    function selectArchive(index) {
      if (index >= levelKeys.value.length) {
        alert("无效的层级，请刷新页面重试");
        return;
      }

      selectedLevelKey.value = levelKeys.value[index];
      showModal.value = true;
      document.body.classList.add("modal-open");
    }

    // 卡片进入动画
    function enterCardAnimation(el, done) {
      gsap.from(el, {
        duration: 0.6,
        y: 40,
        opacity: 0,
        scale: 0.95,
        ease: "back.out(1.7)",
        onComplete: done,
      });
    }

    // 创建存档回调
    function handleCreate(data) {
      console.log("创建存档数据:", data);
      // 强制跳过动画关闭模态框
    }

    // 初始化加载
    onMounted(() => {
      loadLevelNames();
    });

    return {
      imagesMap,
      levelKeys,
      levelNames,
      showModal,
      selectedLevelKey,
      selectArchive,
      getLevelName,
      getImageUrl,
      handleCreate,
      enterCardAnimation,
    };
  },
};
</script>

<style scoped>
.archive-selector {
  width: 100%;
  min-height: 100vh;
  right: 0;
  top: 0;
  background-color: var(--CreateArchive-bg-primary);
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  position: relative;
}

.header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30px 0;
  margin-left: 40px;
  margin-bottom: 10px;
  position: relative;
  z-index: 1;
}

.header h1 {
  color: var(--CreateArchive-text-primary);
  font-size: 2.2rem;
  font-weight: 700;
  margin: 0;
}

.cards-container {
  width: 100%;
  margin-right: 20px;
  margin-left: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
  padding: 10px;
  box-sizing: border-box;
}

.card-wrapper {
  perspective: 1000px;
}

.card {
  display: flex;
  flex-direction: column;
  background: var(--CreateArchive-card-bg);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--CreateArchive-card-shadow);
  border: 1px solid var(--CreateArchive-card-border);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  cursor: pointer;
  height: 340px;
  backdrop-filter: blur(10px);
  position: relative;
}

.card:hover {
  transform: translateY(-8px);
  box-shadow: var(--CreateArchive-card-shadow-hover);
  border-color: var(--CreateArchive-accent-primary);
}

.card:active {
  transform: translateY(2px);
}

.card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--CreateArchive-accent-primary);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.card:hover::before {
  opacity: 1;
}

.card.card-loading {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.8;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 0.8;
  }
}

.card-image {
  height: 60%;
  overflow: hidden;
  position: relative;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.5s ease;
}

.card:hover .card-image img {
  transform: scale(1.05);
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.05);
  color: var(--CreateArchive-text-secondary);
}

.image-placeholder i {
  font-size: 2rem;
  color: var(--CreateArchive-loading-color);
}

.card-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-name {
  text-align: center;
}

.card-name span {
  color: var(--CreateArchive-text-primary);
  font-size: 1.3rem;
  font-weight: 700;
  display: -webkit-box;
  line-clamp: 1;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-action {
  padding: 0 20px 20px;
  display: flex;
  justify-content: center;
}

.ripple-button {
  position: relative;
  overflow: hidden;
  background: var(--CreateArchive-button-bg);
  color: var(--CreateArchive-button-text);
  border: none;
  border-radius: 8px;
  padding: 10px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.ripple-button:hover {
  background: var(--CreateArchive-accent-hover);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.ripple-button:active {
  transform: translateY(1px);
}

.ripple-button::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%);
  transform-origin: 50% 50%;
}

.ripple-button:focus:not(:active)::after {
  animation: ripple 1s ease-out;
}

@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 0.5;
  }
  100% {
    transform: scale(25, 25);
    opacity: 0;
  }
}

@media (max-width: 1200px) {
  .cards-container {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

@media (max-width: 768px) {
  .cards-container {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}

@media (max-width: 480px) {
  .cards-container {
    grid-template-columns: 1fr;
  }

  .card {
    height: 320px;
  }

  .header h1 {
    font-size: 1.8rem;
  }
}
</style>
