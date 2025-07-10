<template>
  <Transition name="modal" appear>
    <div
      v-if="show"
      class="create-archive-modal-overlay"
      @mousedown.self="handleOverlayClick"
    >
      <div
        class="create-archive-modal"
        :class="{ 'light-mode': lightMode }"
        ref="modalRef"
      >
        <div class="modal-header">
          <h2>新建存档</h2>
          <button class="close-btn" @click="closeModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-content">
          <!-- 基本信息板块 -->
          <div class="section">
            <div class="section-header">
              <i class="fas fa-info-circle"></i>
              <h3>基本信息</h3>
            </div>
            <div class="section-content scrollable">
              <div class="form-group">
                <label for="archive-name">存档名称</label>
                <div class="input-wrapper">
                  <p v-if="nameError" class="error-text">请输入存档名称</p>
                  <input
                    id="archive-name"
                    type="text"
                    v-model="newArchive.name"
                    :class="{ 'light-mode': lightMode }"
                    autocomplete="off"
                  />
                </div>
              </div>

              <div class="form-group">
                <label>存档难度</label>
                <CustomSelect
                  v-model="newArchive.difficulty"
                  :options="difficultyOptions"
                  :light-mode="lightMode"
                />
              </div>

              <div class="form-group">
                <label>实际难度</label>
                <CustomSelect
                  v-model="newArchive.actualDifficulty"
                  :options="difficultyOptions"
                  :light-mode="lightMode"
                />
              </div>

              <div class="form-group">
                <label>游戏模式</label>
                <CustomSelect
                  v-model="newArchive.mode"
                  :options="modeOptions"
                  :light-mode="lightMode"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn cancel-btn" @click="closeModal">取消</button>
          <button class="btn confirm-btn" @click="createArchive">
            确认创建
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import { ref, reactive, onMounted, watchEffect, onBeforeUnmount } from "vue";
import gsap from "gsap";
import CustomSelect from "./LG_CustomSelect.vue";
import { resolveResource } from "@tauri-apps/api/path";
import { appDataDir } from "@tauri-apps/api/path";

export default {
  components: {
    CustomSelect,
  },
  props: {
    show: Boolean,
    lightMode: {
      type: Boolean,
      default: true,
    },
    levelKey: {
      type: String,
      default: null,
    },
  },
  emits: ["update:show", "create"],
  setup(props, { emit }) {
    const modalRef = ref(null);
    const isAlive = ref(true);
    const nameError = ref(false);

    const difficultyOptions = ref([
      { value: "简单难度", label: "简单难度" },
      { value: "普通难度", label: "普通难度" },
      { value: "困难难度", label: "困难难度" },
      { value: "噩梦难度", label: "噩梦难度" },
    ]);

    const modeOptions = ref([
      { value: "单人模式", label: "单人模式" },
      { value: "多人模式", label: "多人模式" },
    ]);

    const difficultyMap = {
      简单难度: "Easy",
      普通难度: "Normal",
      困难难度: "Hard",
      噩梦难度: "Nightmare",
    };

    const modeMap = {
      单人模式: "Singleplayer",
      多人模式: "Multiplayer",
    };

    onMounted(async () => {
      try {
        const response = await fetch("/locales/zh-CN/zh-CN.json");
        const data = await response.json();
        // 可按需使用语言包
      } catch (error) {
        console.error("加载语言包失败:", error);
      }
    });

    onBeforeUnmount(() => {
      isAlive.value = false;

      // 清除所有 GSAP 动画
      if (modalRef.value) {
        gsap.killTweensOf(modalRef.value);
      }
    });

    const closeModal = (options = {}) => {
      const { skipAnimation = false } = options;

      if (!isAlive.value) return;

      if (skipAnimation) {
        emit("update:show", false);
        return;
      }

      if (!modalRef.value) return;

      gsap.to(modalRef.value, {
        opacity: 0,
        scale: 0.9,
        y: 30,
        duration: 0.3,
        ease: "back.in(1.7)",
        onComplete: () => {
          if (isAlive.value) {
            emit("update:show", false);
          }
        },
      });
    };

    const newArchive = reactive({
      name: "",
      difficulty: "普通难度",
      actualDifficulty: "普通难度",
      mode: "单人模式",
      levelKey: props.levelKey || "",
    });

    const createArchive = async () => {
      console.log("currentLevelKey:", props.levelKey);
      console.log("newArchive.levelKey:", newArchive.levelKey);

      if (!newArchive.name.trim()) {
        nameError.value = true;
        return;
      }

      nameError.value = false;

      const difficulty =
        difficultyMap[newArchive.difficulty] || newArchive.difficulty;
      const actualDifficulty =
        difficultyMap[newArchive.actualDifficulty] ||
        newArchive.actualDifficulty;
      const mode = modeMap[newArchive.mode] || newArchive.mode;

      // 根据 levelKey 判断使用哪个基础存档文件
      let baseArchiveRelativePath = "BasicArchive.json"; // 默认路径

      const levelKey = newArchive.levelKey;
      if (levelKey === "Pipes1" || levelKey === "Pipes2") {
        baseArchiveRelativePath = "Pipes1.json";
      } else if (levelKey === "Pipes2") {
        baseArchiveRelativePath = "Pipes2.json";
      } else if (levelKey === "Level05") {
        baseArchiveRelativePath = "Level05.json";
      }

      // ✅ 使用 Tauri 的 resolveResource 获取绝对路径
      const baseArchiveAbsolutePath = await resolveResource(
        `public/${baseArchiveRelativePath}`
      );

      const archiveData = {
        name: newArchive.name,
        difficulty,
        actualDifficulty,
        mode,
        levelKey: newArchive.levelKey,
        baseArchivePath: baseArchiveAbsolutePath, // ✅ 绝对路径
      };

      emit("create", archiveData);
      closeModal();
    };

    // 进场动画
    watchEffect(() => {
      if (props.show && modalRef.value) {
        gsap.set(modalRef.value, {
          opacity: 0,
          scale: 0.9,
          y: 30,
        });

        gsap.to(modalRef.value, {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.4,
          ease: "power3.out",
        });
      }

      if (props.show) {
        newArchive.name = "";
        newArchive.difficulty = "普通难度";
        newArchive.actualDifficulty = "普通难度";
        newArchive.mode = "单人模式";
        nameError.value = false;

        newArchive.levelKey = props.levelKey || "";
      }
    });

    return {
      modalRef,
      newArchive,
      difficultyOptions,
      modeOptions,
      closeModal,
      createArchive,
      nameError,
    };
  },
};
</script>

<style scoped>
.create-archive-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  overflow: hidden;
  opacity: 1;
  transition: background-color 0.4s ease;
}

.create-archive-modal {
  position: relative;
  width: 600px;
  height: 700px;
  background: rgba(25, 25, 35, 0.85);
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transform-origin: center;
  will-change: transform, opacity;
  opacity: 1;
  transform: translateY(0) scale(1);
  transition: all 0.4s ease;
}

.create-archive-modal.light-mode {
  background: rgba(240, 242, 245, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.modal-header {
  padding: 20px 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.create-archive-modal.light-mode .modal-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #e0e0ff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.create-archive-modal.light-mode .modal-header h2 {
  color: #2c3e50;
  text-shadow: none;
}

.close-btn {
  background: none;
  border: none;
  color: #a0a0c0;
  font-size: 20px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  transform: rotate(90deg);
}

.create-archive-modal.light-mode .close-btn {
  color: #7f8c8d;
}

.create-archive-modal.light-mode .close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #2c3e50;
}

.modal-content {
  flex: 1;
  padding: 0 20px 20px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 10px;
  min-height: 0;
}

.section-header {
  padding: 15px 20px;
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  margin: 0 10px 10px;
  flex-shrink: 0;
}

.create-archive-modal.light-mode .section-header {
  background: rgba(0, 0, 0, 0.03);
}

.section-header i {
  margin-right: 10px;
  font-size: 18px;
  color: #7a89c9;
}

.create-archive-modal.light-mode .section-header i {
  color: #5a6da8;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #d0d0ff;
}

.create-archive-modal.light-mode .section-header h3 {
  color: #34495e;
}

.section-content {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
  padding: 15px;
  background: rgba(20, 22, 30, 0.5);
  border-radius: 12px;
  min-height: 0;
}

.create-archive-modal.light-mode .section-content {
  background: rgba(245, 247, 250, 0.7);
}

.scrollable::-webkit-scrollbar {
  display: none;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #a0a0d0;
}

.create-archive-modal.light-mode .form-group label {
  color: #5a6da8;
}

.input-wrapper {
  position: relative;
}

.input-wrapper i {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #7a89c9;
  font-size: 16px;
}

input {
  width: 93%;
  padding: 12px 15px;
  background: rgba(30, 32, 45, 0.7);
  border: 1px solid rgba(100, 110, 180, 0.3);
  border-radius: 10px;
  color: #e0e0ff;
  font-size: 14px;
  transition: all 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #7a89c9;
  box-shadow: 0 0 0 2px rgba(100, 110, 180, 0.3);
}

.create-archive-modal.light-mode input {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(120, 140, 220, 0.3);
  color: #2c3e50;
}

.create-archive-modal.light-mode input:focus {
  border-color: #5a6da8;
  box-shadow: 0 0 0 2px rgba(120, 140, 220, 0.3);
}

.modal-footer {
  padding: 10px 30px 20px;
  display: flex;
  justify-content: center;
  gap: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin-top: auto;
  flex-shrink: 0;
}

.create-archive-modal.light-mode .modal-footer {
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.btn {
  padding: 12px 35px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cancel-btn {
  background: rgba(80, 85, 120, 0.3);
  color: #b0b0e0;
}

.cancel-btn:hover {
  background: rgba(100, 105, 140, 0.5);
  color: #e0e0ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.confirm-btn {
  background: linear-gradient(135deg, #7a89c9, #5a6da8);
  color: white;
  box-shadow: 0 4px 12px rgba(100, 110, 180, 0.4);
}

.confirm-btn:hover {
  background: linear-gradient(135deg, #8a99d9, #6a7db8);
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(100, 110, 180, 0.5);
}

/* 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.4s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .create-archive-modal,
.modal-leave-active .create-archive-modal {
  transition: all 0.4s ease;
}

.modal-enter-from .create-archive-modal,
.modal-leave-to .create-archive-modal {
  opacity: 0;
  transform: translateY(30px) scale(0.9);
}

.modal-enter-from .create-archive-modal-overlay,
.modal-leave-to .create-archive-modal-overlay {
  background-color: rgba(0, 0, 0, 0);
}

.error-text {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 4px;
}
</style>
