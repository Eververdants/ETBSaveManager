<script>
import { ref, watch, onMounted } from "vue";
import gsap from "gsap";
import LG_Dropdown from "./LG_Dropdown.vue";

export default {
  name: "EditArchiveModal",
  components: {
    LG_Dropdown,
  },
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    archive: {
      type: Object,
      default: () => ({
        id: 0,
        name: "",
        difficulty: "",
        difficultyClass: "",
        actualDifficulty: "",
        mode: "",
        date: "",
        currentLevel: "",
        hidden: false,
      }),
    },
    lightMode: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:show", "save"],
  setup(props, { emit }) {
    const modalRef = ref(null);
    const backdropRef = ref(null);
    const formRef = ref(null);

    const editedArchive = ref({ ...props.archive });

    // 难度选项
    const difficultyOptions = ref([
      { value: "简单难度", label: "简单难度" },
      { value: "普通难度", label: "普通难度" },
      { value: "困难难度", label: "困难难度" },
      { value: "噩梦难度", label: "噩梦难度" },
    ]);

    // 游戏模式选项
    const modeOptions = ref([
      { value: "单人模式", label: "单人模式" },
      { value: "多人模式", label: "多人模式" },
    ]);

    // 层级选项（示例）
    const levelOptions = ref([
      { value: "Level 0", label: "Level 0 - 前厅" },
      { value: "Level 1", label: "Level 1 - 宜居区" },
      { value: "Level 2", label: "Level 2 - 管道之梦" },
      { value: "Level 3", label: "Level 3 - 发电机室" },
      { value: "Level 4", label: "Level 4 - 废弃办公室" },
      { value: "Level 5", label: "Level 5 - 锅炉房" },
    ]);

    // 关闭模态框
    const closeModal = () => {
      emit("update:show", false);
    };

    // 保存更改
    const saveChanges = () => {
      emit("save", editedArchive.value);
      closeModal();
    };

    // 处理背景点击关闭
    const handleBackdropClick = (e) => {
      if (e.target === backdropRef.value) {
        closeModal();
      }
    };

    // 动画处理
    watch(
      () => props.show,
      (newVal) => {
        if (newVal) {
          // 显示模态框的动画
          gsap.set([backdropRef.value, modalRef.value], { opacity: 0 });
          gsap.set(modalRef.value, { y: 40 });

          const tl = gsap.timeline();
          tl.to(backdropRef.value, {
            opacity: 1,
            duration: 0.3,
            ease: "power2.out",
          })
            .to(
              modalRef.value,
              {
                opacity: 1,
                y: 0,
                duration: 0.4,
                ease: "back.out(1.2)",
              },
              "-=0.1"
            )
            .fromTo(
              formRef.value.children,
              {
                y: 20,
                opacity: 0,
              },
              {
                y: 0,
                opacity: 1,
                stagger: 0.05,
                duration: 0.3,
                ease: "power2.out",
              },
              "-=0.2"
            );
        } else {
          // 隐藏模态框的动画
          const tl = gsap.timeline();
          tl.to(formRef.value.children, {
            y: -10,
            opacity: 0,
            stagger: 0.03,
            duration: 0.2,
            ease: "power2.in",
          })
            .to(
              modalRef.value,
              {
                y: 30,
                opacity: 0,
                duration: 0.3,
                ease: "power2.in",
              },
              "-=0.1"
            )
            .to(backdropRef.value, {
              opacity: 0,
              duration: 0.3,
              ease: "power2.out",
              onComplete: () => {
                // 重置位置
                gsap.set(modalRef.value, { y: 0 });
              },
            });
        }
      }
    );

    // 当存档变化时更新编辑表单
    watch(
      () => props.archive,
      (newArchive) => {
        editedArchive.value = { ...newArchive };
      }
    );

    return {
      modalRef,
      backdropRef,
      formRef,
      editedArchive,
      difficultyOptions,
      modeOptions,
      levelOptions,
      closeModal,
      saveChanges,
      handleBackdropClick,
    };
  },
};
</script>

<template>
  <div
    ref="backdropRef"
    class="edit-modal-backdrop"
    :class="{ 'light-mode': lightMode }"
    @click="handleBackdropClick"
  >
    <div
      ref="modalRef"
      class="living-glass-modal"
      :class="{ 'light-mode': lightMode }"
    >
      <div class="modal-header">
        <h2 class="modal-title">编辑存档信息</h2>
        <button class="close-btn" @click="closeModal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <div ref="formRef" class="edit-form">
        <div class="form-group">
          <label for="archive-name">存档名称</label>
          <input
            id="archive-name"
            type="text"
            v-model="editedArchive.name"
            class="glass-input"
            placeholder="输入存档名称"
          />
        </div>

        <div class="form-group">
          <label>存档难度</label>
          <LG_Dropdown
            v-model="editedArchive.difficulty"
            :options="difficultyOptions"
            :dark-mode="!lightMode"
            :default-text="editedArchive.difficulty || '选择难度'"
          />
        </div>

        <div class="form-group">
          <label>实际难度</label>
          <LG_Dropdown
            v-model="editedArchive.actualDifficulty"
            :options="difficultyOptions"
            :dark-mode="!lightMode"
            :default-text="editedArchive.actualDifficulty || '选择实际难度'"
          />
        </div>

        <div class="form-group">
          <label>游戏模式</label>
          <LG_Dropdown
            v-model="editedArchive.mode"
            :options="modeOptions"
            :dark-mode="!lightMode"
            :default-text="editedArchive.mode || '选择游戏模式'"
          />
        </div>

        <div class="form-group">
          <label>当前层级</label>
          <LG_Dropdown
            v-model="editedArchive.currentLevel"
            :options="levelOptions"
            :dark-mode="!lightMode"
            :default-text="editedArchive.currentLevel || '选择当前层级'"
          />
        </div>

        <div class="form-group">
          <label>存档状态</label>
          <div class="visibility-toggle">
            <button
              class="toggle-btn"
              :class="{ active: !editedArchive.hidden }"
              @click="editedArchive.hidden = false"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
                  stroke="currentColor"
                  stroke-width="2"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="3"
                  stroke="currentColor"
                  stroke-width="2"
                />
              </svg>
              <span>可见</span>
            </button>
            <button
              class="toggle-btn"
              :class="{ active: editedArchive.hidden }"
              @click="editedArchive.hidden = true"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 3L21 21M10.5 10.677C10.1888 11.0296 10 11.4928 10 12C10 13.1046 10.8954 14 12 14C12.5072 14 12.9704 13.8112 13.323 13.5M6.937 6.431C3.226 8.387 1 12 1 12C1 12 5 20 12 20C13.756 20 15.393 19.508 16.823 18.662L6.937 6.431Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
              <span>隐藏</span>
            </button>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="glass-btn cancel-btn" @click="closeModal">取消</button>
        <button class="glass-btn save-btn" @click="saveChanges">
          保存更改
        </button>
      </div>

      <div class="glass-edge"></div>
      <div class="glow-effect"></div>
    </div>
  </div>
</template>

<style scoped>
.edit-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
  transition: background 0.3s ease;
}

.edit-modal-backdrop.light-mode {
  background: rgba(255, 255, 255, 0.7);
}

.living-glass-modal {
  position: relative;
  width: 90%;
  max-width: 500px;
  background: rgba(30, 30, 40, 0.6);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 1px rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  padding: 24px;
  z-index: 10;
  transform: translateY(0);
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

.living-glass-modal.light-mode {
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #e0e0ff;
  text-shadow: 0 0 10px rgba(96, 130, 255, 0.3);
  margin: 0;
}

.light-mode .modal-title {
  color: #3a3a6a;
  text-shadow: 0 0 10px rgba(80, 100, 220, 0.2);
}

.close-btn {
  background: transparent;
  border: none;
  color: #a0a0c0;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}

.light-mode .close-btn:hover {
  color: #333366;
  background: rgba(0, 0, 0, 0.05);
}

.edit-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 0.9rem;
  color: #b0b0d0;
  font-weight: 500;
}

.light-mode .form-group label {
  color: #555577;
}

.glass-input {
  background: rgba(20, 20, 30, 0.4);
  border: 1px solid rgba(100, 120, 255, 0.2);
  border-radius: 8px;
  padding: 12px 16px;
  color: #e0e0ff;
  width: 100%;
  font-size: 1rem;
  outline: none;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
}

.glass-input:focus {
  border-color: rgba(100, 150, 255, 0.6);
  box-shadow: 0 0 0 2px rgba(100, 150, 255, 0.2);
}

.light-mode .glass-input {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(80, 100, 220, 0.2);
  color: #333366;
}

.light-mode .glass-input:focus {
  border-color: rgba(80, 120, 220, 0.5);
  box-shadow: 0 0 0 2px rgba(80, 120, 220, 0.2);
}

.visibility-toggle {
  display: flex;
  gap: 10px;
  margin-top: 5px;
}

.toggle-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  border-radius: 8px;
  background: rgba(40, 40, 60, 0.4);
  border: 1px solid rgba(100, 120, 255, 0.2);
  color: #a0a0d0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-btn:hover {
  background: rgba(60, 70, 100, 0.5);
}

.toggle-btn.active {
  background: rgba(80, 100, 220, 0.4);
  border-color: rgba(100, 150, 255, 0.4);
  color: #ffffff;
  box-shadow: 0 0 12px rgba(100, 150, 255, 0.3);
}

.light-mode .toggle-btn {
  background: rgba(240, 240, 255, 0.6);
  border: 1px solid rgba(80, 100, 220, 0.2);
  color: #555577;
}

.light-mode .toggle-btn:hover {
  background: rgba(220, 220, 255, 0.8);
}

.light-mode .toggle-btn.active {
  background: rgba(120, 140, 255, 0.4);
  border-color: rgba(80, 120, 220, 0.4);
  color: #333366;
  box-shadow: 0 0 12px rgba(80, 120, 220, 0.2);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.glass-btn {
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.glass-btn:before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0) 50%
  );
  pointer-events: none;
}

.cancel-btn {
  background: rgba(60, 60, 80, 0.4);
  color: #b0b0d0;
}

.cancel-btn:hover {
  background: rgba(80, 80, 100, 0.6);
  color: #ffffff;
}

.save-btn {
  background: linear-gradient(
    135deg,
    rgba(80, 100, 220, 0.8),
    rgba(100, 150, 255, 0.8)
  );
  color: white;
  box-shadow: 0 4px 15px rgba(80, 100, 220, 0.3);
}

.save-btn:hover {
  box-shadow: 0 6px 20px rgba(80, 100, 220, 0.5);
  transform: translateY(-2px);
}

.light-mode .cancel-btn {
  background: rgba(220, 220, 230, 0.6);
  color: #555577;
}

.light-mode .cancel-btn:hover {
  background: rgba(200, 200, 220, 0.8);
}

.light-mode .save-btn {
  background: linear-gradient(
    135deg,
    rgba(100, 120, 240, 0.8),
    rgba(120, 150, 255, 0.8)
  );
  box-shadow: 0 4px 15px rgba(80, 100, 220, 0.2);
}

.glass-edge {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(100, 150, 255, 0.6),
    transparent
  );
}

.light-mode .glass-edge {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(80, 120, 220, 0.5),
    transparent
  );
}

.glow-effect {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(100, 150, 255, 0.1) 0%,
    transparent 60%
  );
  pointer-events: none;
  z-index: -1;
}

.light-mode .glow-effect {
  background: radial-gradient(
    circle,
    rgba(120, 150, 255, 0.1) 0%,
    transparent 60%
  );
}
</style>
