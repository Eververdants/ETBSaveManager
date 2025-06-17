<template>
    <div class="glass-scroll-container">
        <div class="glass-scroll-content">
            <div class="cards-container" :data-theme="lightMode ? 'light' : 'dark'">
                <Card v-for="archive in archives" :key="archive.id" :archive="archive" :lightMode="lightMode" />
            </div>
        </div>
    </div>
</template>

<script>
import Card from "../components/LG_Card.vue";
import { invoke } from '@tauri-apps/api/core';

async function loadSaves() {
    try {
        const saves = await invoke('load_all_saves');
        console.log('匹配到以下存档：', saves);
        saves.forEach(save => {
            console.log(`
        序号: ${save.id}
        类型: ${save.mode}
        名字: ${save.name}
        难度: ${save.difficulty}
        难度类: ${save.difficulty_class}
        实际难度: ${save.actual_difficulty}
        修改日期: ${save.date}
        当前层级: ${save.current_level}
        可见性: ${save.hidden ? '已隐藏' : '可见'}
        路径: ${save.path}
      `);
        });
    } catch (err) {
        console.error('加载失败:', err);
    }
}

loadSaves()

export default {
    components: { Card },
    data() {
        return {
            lightMode: true,
            archives: [] // 初始化为空数组
        };
    },
    async mounted() {
        await this.loadSaves();
    },
    methods: {
        async loadSaves() {
            try {
                const saves = await invoke('load_all_saves');
                console.log('匹配到以下存档：', saves);

                // 将获取到的数据映射为组件需要的格式并赋值给 archives
                this.archives = saves.map(save => ({
                    id: save.id,
                    name: save.name,
                    difficulty: save.difficulty,
                    difficultyClass: save.difficulty_class,
                    setDifficulty: save.difficulty,
                    actualDifficulty: save.actual_difficulty,
                    mode: save.mode,
                    date: save.date,
                    currentLevel: save.current_level,
                    hidden: save.hidden,
                }));

            } catch (err) {
                console.error('加载失败:', err);
            }
        },
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
    background-color: #D4DDE5;
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
:root {
  --scrollbar-width: 12px;
  --scrollbar-border-radius: 20px; /* 圆角与容器一致 */
  --scrollbar-thumb-color: rgba(138, 158, 255, 0.5);
  --scrollbar-track-color: rgba(255, 255, 255, 0.1);
  --scrollbar-hover-color: rgba(138, 158, 255, 0.8);
  --container-border-radius: 20px;
}

.glass-scroll-container {
    position: relative;
    overflow: hidden;
    border-radius: var(--container-border-radius);
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(16px);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.light-mode {
  --scrollbar-thumb-color: rgba(102, 126, 234, 0.5);
  --scrollbar-track-color: rgba(0, 0, 0, 0.05);
  --scrollbar-hover-color: rgba(102, 126, 234, 0.8);
}

.glass-scroll-content::-webkit-scrollbar {
  width: var(--scrollbar-width);
}


.glass-scroll-content::-webkit-scrollbar-track {
    background: var(--scrollbar-track-color);
    border-radius: var(--scrollbar-border-radius);
}

.glass-scroll-content::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb-color);
    border-radius: var(--scrollbar-border-radius);
    background-clip: padding-box;
    transition: all 0.3s ease;
}

.glass-scroll-content::-webkit-scrollbar-thumb:hover {
    background: var(--scrollbar-hover-color);
}

.glass-scroll-content {
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb-color) var(--scrollbar-track-color);
}
</style>