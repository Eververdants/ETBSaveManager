<template>
  <div class="blueprint-create-container">
    <!-- 返回按钮 -->
    <button class="back-button" @click="goBack">
      <font-awesome-icon :icon="['fas', 'arrow-left']" />
      <span>{{ $t("common.back") }}</span>
    </button>

    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">{{ $t("blueprintCreate.title") }}</h1>
      <p class="page-subtitle">{{ $t("blueprintCreate.subtitle") }}</p>
    </div>

    <!-- 开发中提示 -->
    <div class="coming-soon-card">
      <div class="coming-soon-icon">
        <font-awesome-icon :icon="['fas', 'drafting-compass']" />
      </div>
      <h2>{{ $t("blueprintCreate.comingSoon") }}</h2>
      <p>{{ $t("blueprintCreate.comingSoonDesc") }}</p>
    </div>
  </div>
</template>

<script>
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

export default {
  name: "BlueprintCreateArchive",
  setup() {
    const router = useRouter();
    const { t } = useI18n({ useScope: "global" });

    const goBack = () => {
      router.push("/create-archive");
    };

    return {
      goBack,
    };
  },
};
</script>

<style scoped>
.blueprint-create-container {
  min-height: 100vh;
  padding: var(--space-6);
  background: var(--bg-primary);
  position: relative;
}

.back-button {
  position: absolute;
  top: var(--space-5);
  left: var(--space-5);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow-md);
  z-index: 100;
}

.back-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  background: var(--bg-tertiary);
  border-color: var(--accent-color);
}

.page-header {
  text-align: center;
  margin-top: var(--space-12);
  margin-bottom: var(--space-8);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.page-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
}

.coming-soon-card {
  max-width: 500px;
  margin: 0 auto;
  padding: var(--space-10);
  background: var(--bg-secondary);
  border: 1px solid var(--divider-light);
  border-radius: var(--radius-xl);
  text-align: center;
  box-shadow: var(--shadow-lg);
}

.coming-soon-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto var(--space-6);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-hover));
  border-radius: 50%;
  font-size: 2rem;
  color: white;
}

.coming-soon-card h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-3);
}

.coming-soon-card p {
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.6;
}
</style>
