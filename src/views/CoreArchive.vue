<template>
  <div class="core-archive-container">
    <!-- 主要内容区域 -->
    <div class="content-area">
      <!-- 功能区域 -->
      <div class="feature-section">
        <div class="section-header">{{ $t("sidebar.featureOptions") }}</div>
        
        <!-- 经验值调整 -->
        <div class="experience-control">
          <div class="control-header">
            <div class="control-icon">
              <font-awesome-icon :icon="['fas', 'star']" />
            </div>
            <div class="control-info">
              <h3>经验值调整</h3>
              <p>调整玩家经验值（0 - 1,000,000,000）</p>
            </div>
          </div>
          
          <div class="control-body">
            <!-- 数值输入框 -->
            <div class="input-group">
              <label>当前经验值</label>
              <input 
                type="number" 
                v-model.number="experience" 
                @input="handleExperienceInput"
                min="0" 
                max="1000000000"
                class="experience-input"
                placeholder="输入经验值"
              />
            </div>
            
            <!-- 滑条 -->
            <div class="slider-group">
              <input 
                type="range" 
                v-model.number="experience" 
                @input="handleExperienceSlider"
                min="0" 
                max="1000000000"
                step="1000"
                class="experience-slider"
              />
              <div class="slider-labels">
                <span>0</span>
                <span>{{ formatNumber(experience) }}</span>
                <span>1,000,000,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import storage from "../services/storageService";

export default {
  name: "CoreArchive",
  data() {
    return {
      experience: 0,
    };
  },
  methods: {
    handleExperienceInput(event) {
      let value = parseInt(event.target.value) || 0;
      // 限制范围
      if (value < 0) value = 0;
      if (value > 1000000000) value = 1000000000;
      this.experience = value;
    },
    handleExperienceSlider(event) {
      this.experience = parseInt(event.target.value) || 0;
    },
    formatNumber(num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
  },
  mounted() {
    // 从本地存储恢复经验值
    const savedExperience = storage.getItem("coreArchiveExperience");
    if (savedExperience !== null) {
      this.experience = parseInt(savedExperience) || 0;
    }
  },
  watch: {
    experience(newValue) {
      // 保存经验值到本地存储
      storage.setItem("coreArchiveExperience", newValue);
    },
  },
};
</script>

<style scoped>
.core-archive-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 内容区域 */
.content-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 分区标题 */
.section-header {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #1c1c1e);
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--divider-light, rgba(60, 60, 67, 0.05));
}

/* 简化功能区域样式 */
.feature-section {
  background: var(--card-bg, #ffffff);
  border-radius: var(--radius-md, 12px);
  padding: 16px;
  border: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.feature-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--surface-color, #ffffff);
  border-radius: var(--radius-md, 12px);
  border: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
  transition: all 0.2s ease;
}

.feature-card:hover {
  background: var(--surface-hover, #f8f9fa);
  border-color: var(--accent-color, #007aff);
}

.feature-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-color, #007aff);
  color: white;
  border-radius: var(--radius-md, 12px);
  font-size: 18px;
}

.feature-content h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #1c1c1e);
  margin: 0 0 2px 0;
}

.feature-content p {
  font-size: 13px;
  color: var(--text-secondary, #3a3a3c);
  margin: 0;
}

/* 暗色主题适配 */
[data-theme="dark"] .feature-section {
  background: var(--card-bg, #2c2c2e);
}

/* 经验值控制样式 */
.experience-control {
  background: var(--surface-color, #ffffff);
  border-radius: var(--radius-md, 12px);
  padding: 20px;
  border: 1px solid var(--border-color, rgba(60, 60, 67, 0.1));
  margin-top: 12px;
}

.control-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.control-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: var(--radius-md, 12px);
  font-size: 20px;
}

.control-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #1c1c1e);
  margin: 0 0 4px 0;
}

.control-info p {
  font-size: 14px;
  color: var(--text-secondary, #3a3a3c);
  margin: 0;
}

.control-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 输入框组 */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #1c1c1e);
}

.experience-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 16px;
  border: 2px solid var(--border-color, rgba(60, 60, 67, 0.1));
  border-radius: var(--radius-md, 12px);
  background: var(--bg-secondary, #f8f9fa);
  color: var(--text-primary, #1c1c1e);
  transition: all 0.2s ease;
}

/* 隐藏数字输入框的上下箭头 */
.experience-input::-webkit-outer-spin-button,
.experience-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.experience-input[type=number] {
  -moz-appearance: textfield;
}

.experience-input:focus {
  outline: none;
  border-color: var(--accent-color, #007aff);
  background: var(--card-bg, #ffffff);
}

/* 滑条组 */
.slider-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.experience-slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: var(--bg-tertiary, #e5e5ea);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.experience-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-color, #007aff);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
  transition: all 0.2s ease;
}

.experience-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.5);
}

.experience-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-color, #007aff);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
  transition: all 0.2s ease;
}

.experience-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.5);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary, #3a3a3c);
  padding: 0 4px;
}

.slider-labels span:nth-child(2) {
  font-weight: 600;
  color: var(--accent-color, #007aff);
  font-size: 14px;
}

/* 暗色主题适配 - 经验值控制 */
[data-theme="dark"] .experience-control {
  background: var(--surface-color, #2c2c2e);
}

[data-theme="dark"] .experience-input {
  background: var(--bg-tertiary, #3a3a3c);
  border-color: var(--border-color, rgba(255, 255, 255, 0.1));
  color: var(--text-primary, #ffffff);
}

[data-theme="dark"] .experience-input:focus {
  background: var(--card-bg, #2c2c2e);
}

</style>
