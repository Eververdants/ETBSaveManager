<template>
  <div class="feedback-page">
    <!-- 主内容区域 - 自适应双栏布局 -->
    <div class="feedback-layout">
      <!-- 左侧：反馈表单 -->
      <div class="feedback-form-panel">
        <div class="panel-card">
          <transition name="text-swift" mode="out-in">
            <div class="panel-header" :key="currentLanguage">
              <font-awesome-icon :icon="['fas', 'comment-dots']" class="header-icon" />
              {{ t("feedback.title") }}
            </div>
          </transition>

          <div class="panel-content">
            <!-- 反馈类型选择 -->
            <div class="form-group">
              <transition name="text-swift" mode="out-in">
                <label class="form-label" :key="currentLanguage">
                  {{ t("feedback.type") }}
                </label>
              </transition>
              <CustomDropdown v-model="formData.type" :options="feedbackTypeOptions"
                :placeholder="t('feedback.selectType')" />
            </div>

            <!-- Bug 严重程度 -->
            <div class="form-group" v-if="formData.type === 'bug'">
              <transition name="text-swift" mode="out-in">
                <label class="form-label" :key="currentLanguage">
                  {{ t("feedback.severity") }}
                </label>
              </transition>
              <CustomDropdown v-model="formData.severity" :options="severityOptions"
                :placeholder="t('feedback.selectSeverity')" />
            </div>

            <!-- 发送人（可选） -->
            <div class="form-group">
              <transition name="text-swift" mode="out-in">
                <label class="form-label" :key="currentLanguage">
                  {{ t("feedback.sender") }}
                  <span class="optional-hint">{{ t("feedback.optional") }}</span>
                </label>
              </transition>
              <input type="text" v-model="formData.sender" :placeholder="t('feedback.senderPlaceholder')"
                class="form-input" maxlength="50" />
            </div>

            <!-- 标题输入 -->
            <div class="form-group">
              <transition name="text-swift" mode="out-in">
                <label class="form-label" :key="currentLanguage">
                  {{ t("feedback.titleLabel") }}
                  <span class="char-count">{{ formData.title.length }}/100</span>
                </label>
              </transition>
              <input type="text" v-model="formData.title" :placeholder="t('feedback.titlePlaceholder')"
                class="form-input" :class="{ 'input-error': titleError }" maxlength="100" />
              <span v-if="titleError" class="error-text">{{ titleError }}</span>
            </div>

            <!-- 描述输入 -->
            <div class="form-group description-group">
              <transition name="text-swift" mode="out-in">
                <label class="form-label" :key="currentLanguage">
                  {{ t("feedback.description") }}
                  <span class="char-count">{{ formData.description.length }}/5000</span>
                </label>
              </transition>
              <textarea v-model="formData.description" :placeholder="t('feedback.descriptionPlaceholder')"
                class="form-textarea" :class="{ 'input-error': descriptionError }" maxlength="5000"></textarea>
              <span v-if="descriptionError" class="error-text">{{ descriptionError }}</span>
            </div>

            <!-- 附件上传区域 -->
            <div class="form-group">
              <transition name="text-swift" mode="out-in">
                <label class="form-label" :key="currentLanguage">
                  {{ t("feedback.attachments") }}
                  <span class="attachment-hint">{{ t("feedback.attachmentHint") }}</span>
                </label>
              </transition>
              <div ref="dropZone" class="attachment-drop-zone" :class="{ 'drag-over': isDragOver }"
                @click="triggerFileInput">
                <font-awesome-icon :icon="['fas', 'cloud-upload-alt']" class="upload-icon" />
                <span>{{ t("feedback.dropOrClick") }}</span>
              </div>
              <input ref="fileInput" type="file" multiple accept=".png,.jpg,.jpeg,.gif,.txt,.log,.json"
                style="display: none" @change="handleFileSelect" />

              <!-- 附件预览列表 -->
              <div v-if="attachments.length > 0" class="attachment-list">
                <div v-for="(file, index) in attachments" :key="index" class="attachment-item">
                  <img v-if="isImageFile(file)" :src="file.preview" class="attachment-preview" />
                  <font-awesome-icon v-else :icon="['fas', 'file-alt']" class="file-icon" />
                  <span class="attachment-name">{{ file.name }}</span>
                  <button class="remove-btn" @click="removeAttachment(index)">
                    <font-awesome-icon :icon="['fas', 'times']" />
                  </button>
                </div>
              </div>
              <span v-if="attachmentError" class="error-text">{{ attachmentError }}</span>
            </div>

            <!-- 系统信息预览 -->
            <div class="form-group">
              <details class="system-info-details">
                <summary>
                  <font-awesome-icon :icon="['fas', 'info-circle']" />
                  {{ t("feedback.systemInfo") }}
                </summary>
                <div class="system-info-content" v-if="systemInfo">
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">{{ t("feedback.os") }}</span>
                      <span class="info-value">{{ systemInfo.os }} {{ systemInfo.osVersion }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">{{ t("feedback.appVersion") }}</span>
                      <span class="info-value">{{ systemInfo.appVersion }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">{{ t("feedback.language") }}</span>
                      <span class="info-value">{{ systemInfo.language }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">{{ t("feedback.resolution") }}</span>
                      <span class="info-value">{{ systemInfo.screenResolution }}</span>
                    </div>
                  </div>
                </div>
              </details>
            </div>

            <!-- 提交按钮 -->
            <div class="form-actions">
              <button class="submit-btn" :disabled="!isFormValid || isSubmitting" @click="submitFeedback">
                <font-awesome-icon v-if="isSubmitting" :icon="['fas', 'spinner']" spin />
                <font-awesome-icon v-else :icon="['fas', 'paper-plane']" />
                <span>{{ isSubmitting ? t("feedback.submitting") : t("feedback.submit") }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：反馈历史记录 -->
      <div class="feedback-history-panel">
        <div class="panel-card">
          <transition name="text-swift" mode="out-in">
            <div class="panel-header" :key="currentLanguage">
              <font-awesome-icon :icon="['fas', 'history']" class="header-icon" />
              {{ t("feedback.history") }}
              <span v-if="feedbackHistory.length > 0" class="history-count">
                {{ feedbackHistory.length }}
              </span>
            </div>
          </transition>

          <div class="panel-content">

            <div v-if="feedbackHistory.length === 0" class="empty-history">
              <font-awesome-icon :icon="['fas', 'inbox']" class="empty-icon" />
              <span>{{ t("feedback.noHistory") }}</span>
            </div>

            <div v-else class="history-list">
              <div v-for="item in feedbackHistory" :key="item.id" class="history-item">
                <div class="history-header">
                  <span :class="['history-type', item.feedback_type]">
                    <font-awesome-icon :icon="getTypeIcon(item.feedback_type)" />
                    {{ getTypeLabel(item.feedback_type) }}
                  </span>
                  <span :class="['history-status', item.status]">
                    {{ getStatusLabel(item.status) }}
                  </span>
                </div>
                <div class="history-title">{{ item.title }}</div>
                <div class="history-date">
                  <font-awesome-icon :icon="['fas', 'clock']" />
                  {{ formatDate(item.created_at) }}
                </div>
                <div class="history-actions">
                  <a v-if="item.status === 'submitted' && item.discussion_url" :href="item.discussion_url"
                    target="_blank" class="action-link">
                    <font-awesome-icon :icon="['fas', 'external-link-alt']" class="action-icon" />
                    <span>{{ t("feedback.viewDiscussion") }}</span>
                  </a>
                  <button v-if="item.status === 'failed'" class="action-btn retry" @click="retryFeedback(item.id)">
                    <font-awesome-icon :icon="['fas', 'redo']" class="action-icon" />
                    <span>{{ t("feedback.retry") }}</span>
                  </button>
                  <button class="action-btn delete" @click="deleteFeedback(item.id)">
                    <font-awesome-icon :icon="['fas', 'trash']" class="action-icon" />
                    <span>{{ t("feedback.delete") }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
import { useI18n } from "vue-i18n";
import CustomDropdown from "../components/CustomDropdown.vue";
import { feedbackService } from "../services/feedbackService.js";

export default {
  name: "Feedback",
  components: {
    CustomDropdown,
  },
  data() {
    return {
      formData: {
        type: "",
        severity: "",
        sender: "",
        title: "",
        description: "",
      },
      attachments: [],
      systemInfo: null,
      feedbackHistory: [],
      isSubmitting: false,
      isDragOver: false,
      titleError: "",
      descriptionError: "",
      attachmentError: "",
      currentLanguage: localStorage.getItem("language") || "zh-CN",
    };
  },
  computed: {
    feedbackTypeOptions() {
      return [
        { value: "bug", label: this.$t("feedback.types.bug") },
        { value: "idea", label: this.$t("feedback.types.idea") },
        { value: "general", label: this.$t("feedback.types.general") },
        { value: "ui", label: this.$t("feedback.types.ui") },
      ];
    },
    severityOptions() {
      return [
        { value: "low", label: this.$t("feedback.severities.low") },
        { value: "medium", label: this.$t("feedback.severities.medium") },
        { value: "high", label: this.$t("feedback.severities.high") },
        { value: "critical", label: this.$t("feedback.severities.critical") },
      ];
    },
    isFormValid() {
      return (
        this.formData.type &&
        this.formData.title.trim().length > 0 &&
        this.formData.title.length <= 100 &&
        this.formData.description.trim().length > 0 &&
        this.formData.description.length <= 5000 &&
        this.attachments.length <= 5
      );
    },
  },
  setup() {
    const { t, locale } = useI18n({ useScope: "global" });
    return { t, locale };
  },

  async mounted() {
    await this.loadSystemInfo();
    await this.loadHistory();
    window.addEventListener("language-changed", this.handleLanguageChange);

    // 手动绑定拖拽事件到拖拽区域
    this.$nextTick(() => {
      this.setupDropZone();
    });
  },
  beforeUnmount() {
    window.removeEventListener("language-changed", this.handleLanguageChange);
    this.cleanupDropZone();
  },
  methods: {
    setupDropZone() {
      const dropZone = this.$refs.dropZone;
      if (!dropZone) return;

      this._onDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.isDragOver = true;
      };

      this._onDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = "copy";
        }
        this.isDragOver = true;
      };

      this._onDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // 检查是否真的离开了拖拽区域
        const rect = dropZone.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX >= rect.right ||
          e.clientY < rect.top || e.clientY >= rect.bottom) {
          this.isDragOver = false;
        }
      };

      this._onDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.isDragOver = false;

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
          this.processFiles(Array.from(files));
        }
      };

      dropZone.addEventListener("dragenter", this._onDragEnter);
      dropZone.addEventListener("dragover", this._onDragOver);
      dropZone.addEventListener("dragleave", this._onDragLeave);
      dropZone.addEventListener("drop", this._onDrop);
    },

    cleanupDropZone() {
      const dropZone = this.$refs.dropZone;
      if (!dropZone) return;

      if (this._onDragEnter) dropZone.removeEventListener("dragenter", this._onDragEnter);
      if (this._onDragOver) dropZone.removeEventListener("dragover", this._onDragOver);
      if (this._onDragLeave) dropZone.removeEventListener("dragleave", this._onDragLeave);
      if (this._onDrop) dropZone.removeEventListener("drop", this._onDrop);
    },

    handleLanguageChange(event) {
      this.currentLanguage = event.detail?.language || localStorage.getItem("language");
    },

    async loadSystemInfo() {
      try {
        this.systemInfo = await feedbackService.getSystemInfo();
      } catch (error) {
        console.error("加载系统信息失败:", error);
        this.systemInfo = {
          os: "Unknown",
          osVersion: "",
          appVersion: "3.0.0-Alpha-7.3",
          language: this.currentLanguage,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
        };
      }
    },

    async loadHistory() {
      try {
        this.feedbackHistory = await feedbackService.getHistory();
      } catch (error) {
        console.error("加载反馈历史失败:", error);
        this.feedbackHistory = [];
      }
    },

    async submitFeedback() {
      if (!this.isFormValid || this.isSubmitting) return;
      this.isSubmitting = true;
      this.clearErrors();

      try {
        const result = await feedbackService.submitFeedback({
          type: this.formData.type,
          severity: this.formData.type === "bug" ? this.formData.severity : null,
          sender: this.formData.sender.trim() || null,
          title: this.formData.title,
          description: this.formData.description,
          attachments: this.attachments.map((a) => ({
            name: a.name,
            content: a.content,
            mime_type: a.type,
          })),
        });

        if (result.queued) {
          this.$toast?.success(this.$t("feedback.savedOffline"));
        } else {
          this.$toast?.success(this.$t("feedback.submitSuccess"));
        }
        this.resetForm();
        await this.loadHistory();
      } catch (error) {
        console.error("提交反馈失败:", error);
        this.$toast?.error(this.$t("feedback.submitError"));
      } finally {
        this.isSubmitting = false;
      }
    },

    async retryFeedback(id) {
      try {
        await feedbackService.retryFeedback(id);
        this.$toast?.success(this.$t("feedback.retrySuccess"));
        await this.loadHistory();
      } catch (error) {
        console.error("重试失败:", error);
        this.$toast?.error(this.$t("feedback.retryError"));
      }
    },

    async deleteFeedback(id) {
      try {
        await feedbackService.deleteFeedback(id);
        this.$toast?.success(this.$t("feedback.deleteSuccess"));
        await this.loadHistory();
      } catch (error) {
        console.error("删除失败:", error);
        this.$toast?.error(this.$t("feedback.deleteError"));
      }
    },

    triggerFileInput() {
      this.$refs.fileInput.click();
    },

    handleFileSelect(event) {
      const files = Array.from(event.target.files);
      this.processFiles(files);
      event.target.value = "";
    },

    async processFiles(files) {
      this.attachmentError = "";
      const allowedExtensions = [".png", ".jpg", ".jpeg", ".gif", ".txt", ".log", ".json"];
      const maxSize = 25 * 1024 * 1024;
      const maxFiles = 5;

      for (const file of files) {
        if (this.attachments.length >= maxFiles) {
          this.attachmentError = this.$t("feedback.maxFilesError");
          break;
        }

        const ext = "." + file.name.split(".").pop().toLowerCase();
        if (!allowedExtensions.includes(ext)) {
          this.attachmentError = this.$t("feedback.invalidFileType");
          continue;
        }

        if (file.size > maxSize) {
          this.attachmentError = this.$t("feedback.fileTooLarge");
          continue;
        }

        const content = await this.readFileAsBase64(file);
        this.attachments.push({
          name: file.name,
          type: file.type,
          size: file.size,
          content: content,
          preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        });
      }
    },

    readFileAsBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },

    removeAttachment(index) {
      const attachment = this.attachments[index];
      if (attachment.preview) URL.revokeObjectURL(attachment.preview);
      this.attachments.splice(index, 1);
      this.attachmentError = "";
    },

    isImageFile(file) {
      return file.type && file.type.startsWith("image/");
    },

    resetForm() {
      this.formData = { type: "", severity: "", sender: "", title: "", description: "" };
      this.attachments.forEach((a) => { if (a.preview) URL.revokeObjectURL(a.preview); });
      this.attachments = [];
      this.clearErrors();
    },

    clearErrors() {
      this.titleError = "";
      this.descriptionError = "";
      this.attachmentError = "";
    },

    getTypeLabel(type) {
      const labels = {
        bug: this.$t("feedback.types.bug"),
        idea: this.$t("feedback.types.idea"),
        general: this.$t("feedback.types.general"),
        ui: this.$t("feedback.types.ui"),
      };
      return labels[type] || type;
    },

    getTypeIcon(type) {
      const icons = {
        bug: ['fas', 'bug'],
        idea: ['fas', 'lightbulb'],
        general: ['fas', 'comment'],
        ui: ['fas', 'paint-brush'],
      };
      return icons[type] || ['fas', 'comment'];
    },

    getStatusLabel(status) {
      const labels = {
        pending: this.$t("feedback.statuses.pending"),
        submitted: this.$t("feedback.statuses.submitted"),
        failed: this.$t("feedback.statuses.failed"),
      };
      return labels[status] || status;
    },

    formatDate(dateStr) {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      return date.toLocaleString(this.currentLanguage);
    },
  },
};
</script>


<style scoped>
.feedback-page {
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
  overflow: hidden;
}

.feedback-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  height: 100%;
  max-height: calc(100vh - 100px);
}

/* 面板卡片通用样式 */
.panel-card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--text-primary);
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 20px;
  flex-shrink: 0;
}

.header-icon {
  color: var(--primary);
  font-size: 1.1rem;
}

.history-count {
  background: var(--primary);
  color: white;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: auto;
}

/* 表单面板 */
.feedback-form-panel {
  height: 100%;
  overflow: hidden;
}

.feedback-form-panel .panel-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.form-group {
  margin-bottom: 18px;
}

.form-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.char-count {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: normal;
}

.attachment-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: normal;
}

.optional-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: normal;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
  max-height: 200px;
}

.description-group .form-textarea {
  flex: 1;
}

.input-error {
  border-color: var(--danger) !important;
}

.error-text {
  display: block;
  color: var(--danger);
  font-size: 0.8rem;
  margin-top: 4px;
}

/* 附件上传区域 */
.attachment-drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-secondary);
}

.attachment-drop-zone:hover,
.attachment-drop-zone.drag-over {
  border-color: var(--primary);
  background: rgba(var(--primary-rgb), 0.05);
}

.upload-icon {
  font-size: 1.5rem;
  margin-bottom: 8px;
}

.attachment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  max-width: 200px;
}

.attachment-preview {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border-radius: 4px;
}

.file-icon {
  font-size: 1.25rem;
  color: var(--text-secondary);
}

.attachment-name {
  font-size: 0.8rem;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.remove-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}

.remove-btn:hover {
  color: var(--danger);
}

/* 系统信息 */
.system-info-details {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
}

.system-info-details summary {
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.system-info-content {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.info-value {
  font-size: 0.85rem;
  color: var(--text-primary);
}

/* 提交按钮 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 16px;
}

.submit-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 历史记录面板 */
.feedback-history-panel {
  height: 100%;
  overflow: hidden;
}

.feedback-history-panel .panel-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.feedback-history-panel .panel-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--text-secondary);
  flex: 1;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 16px;
  transition: border-color 0.2s;
}

.history-item:hover {
  border-color: var(--primary);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.history-type {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 500;
}

.history-type svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.history-type.bug {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.history-type.idea {
  background: rgba(255, 193, 7, 0.1);
  color: #ffc107;
}

.history-type.general {
  background: rgba(var(--primary-rgb), 0.1);
  color: var(--primary);
}

.history-type.ui {
  background: rgba(111, 66, 193, 0.1);
  color: #6f42c1;
}

.history-status {
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 500;
}

.history-status.pending {
  background: rgba(255, 193, 7, 0.15);
  color: #e6a700;
}

.history-status.submitted {
  background: rgba(40, 167, 69, 0.15);
  color: #28a745;
}

.history-status.failed {
  background: rgba(220, 53, 69, 0.15);
  color: #dc3545;
}

.history-title {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 6px;
  line-height: 1.4;
}

.history-date {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.history-date svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.history-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--primary);
  text-decoration: none;
  transition: opacity 0.2s;
}

.action-link:hover {
  opacity: 0.8;
}

.action-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.retry {
  background: rgba(var(--primary-rgb), 0.1);
  color: var(--primary);
}

.action-btn.retry:hover {
  background: rgba(var(--primary-rgb), 0.2);
}

.action-btn.delete {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.action-btn.delete:hover {
  background: rgba(220, 53, 69, 0.2);
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .feedback-layout {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
    max-height: none;
    overflow-y: auto;
  }

  .feedback-form-panel,
  .feedback-history-panel {
    height: auto;
    max-height: none;
  }

  .panel-card {
    height: auto;
    max-height: none;
  }

  .feedback-history-panel .panel-card {
    max-height: 400px;
  }

  .history-list {
    max-height: 300px;
  }
}

@media (max-width: 768px) {
  .feedback-page {
    padding: 12px;
  }

  .feedback-layout {
    gap: 16px;
  }

  .panel-card {
    padding: 16px;
  }

  .panel-header {
    font-size: 1rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .attachment-list {
    flex-direction: column;
  }

  .attachment-item {
    max-width: 100%;
  }
}

/* 过渡动画 */
.text-swift-enter-active,
.text-swift-leave-active {
  transition: opacity 0.15s ease;
}

.text-swift-enter-from,
.text-swift-leave-to {
  opacity: 0;
}

/* 滚动条样式 */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.panel-content::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
</style>
