<template>
  <div :class="{ 'light-mode': lightMode }">
    <ArchiveCard v-for="archive in archives" :key="archive.id" :archive="archive" :light-mode="lightMode"
      @delete="handleDelete" @edit="handleEdit" @toggle="handleToggle" />
  </div>
</template>

<script>
import ArchiveCard from '../components/LG_Card.vue';

export default {
  components: { ArchiveCard },
  data() {
    return {
      lightMode: true,
      archives: [
        {
          id: 1,
          name: "森林探险存档",
          difficulty: "中等",
          difficultyClass: "medium",
          setDifficulty: "普通",
          actualDifficulty: "困难",
          mode: "生存模式",
          date: "2023-06-15",
          currentLevel: "Level 5",
          hidden: false
        },
        {
          id: 2,
          name: "城市建造计划",
          difficulty: "简单",
          difficultyClass: "easy",
          setDifficulty: "简单",
          actualDifficulty: "普通",
          mode: "创造模式",
          date: "2023-05-22",
          currentLevel: "Level 5",
          hidden: false
        },
        {
          id: 3,
          name: "末日生存挑战",
          difficulty: "困难",
          difficultyClass: "hard",
          setDifficulty: "困难",
          actualDifficulty: "噩梦",
          mode: "极限模式",
          date: "2023-07-10",
          currentLevel: "末日",
          hidden: true
        }
      ]
    };
  },
  methods: {
    handleDelete(archiveId) {
      // 处理删除逻辑
    },
    handleEdit(archiveId) {
      // 处理编辑逻辑
    },
    handleToggle(archiveId) {
      // 处理切换可见性逻辑
    }
  }
};
</script>

<style scoped>
.btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: 32px 24px;
  margin-bottom: 16px;
}
.btn-demo {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 180px;
}
pre {
  margin: 12px 0 0 0;
  background: rgba(0,0,0,0.04);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  color: #444;
  width: 100%;
  overflow-x: auto;
}
.btn-row[style*='background'] pre {
  background: rgba(255,255,255,0.08);
  color: #eee;
}

.btn {
    margin: 10px;
}

.achieve-list {
  display: grid;
    grid-template-columns: repeat(3, var(--card-width));
    gap: 25px;
    width: 100%;
    padding: 0 20px;
    justify-content: center;
}


</style>