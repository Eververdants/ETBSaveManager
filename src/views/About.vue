<template>
  <div :class="['about-container', theme]">
    <div class="living-glass-panel">
      <div class="sidebar">
        <div
          v-for="(item, index) in sidebarItems"
          :key="index"
          :class="['sidebar-item', { active: activeItem === index }]"
          @click="activeItem = index"
        >
          <div class="icon">{{ item.icon }}</div>
          <div class="title">{{ item.title }}</div>
        </div>
      </div>

      <div class="content">
        <div class="markdown-content" v-html="compiledMarkdown"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { marked } from "marked";

export default {
  name: "AboutPage",
  data() {
    return {
      theme: "light",
      activeItem: 0,
      sidebarItems: [
        {
          icon: "👤",
          title: "项目介绍",
          file: "/markdown/about/introduction-CN.md",
        },
        {
          icon: "👤",
          title: "更新公告",
          file: "/markdown/about/announcement-CN.md",
        },
        { icon: "⚖️", title: "法律声明", file: "/markdown/about/license.md" },
      ],
      markdownTexts: [], // 存储从文件读取的内容
      isLoading: true,
    };
  },
  computed: {
    compiledMarkdown() {
      return this.markdownTexts[this.activeItem]
        ? marked(this.markdownTexts[this.activeItem], { breaks: true })
        : "<p>加载中...</p>";
    },
  },
  methods: {
    async loadMarkdownFiles() {
      const promises = this.sidebarItems.map(async (item, index) => {
        try {
          const response = await fetch(item.file);
          if (!response.ok) throw new Error(`无法加载 ${item.file}`);
          const text = await response.text();
          this.markdownTexts[index] = text;
        } catch (error) {
          console.error(error);
          this.markdownTexts[index] = `⚠️ 加载失败：${item.title}`;
        }
      });

      await Promise.all(promises);
      this.isLoading = false;
    },
    toggleTheme() {
      this.theme = this.theme === "light" ? "dark" : "light";
    },
  },
  mounted() {
    marked.setOptions({
      gfm: true,
      tables: true,
      breaks: true,
      pedantic: false,
      sanitize: false,
      smartLists: true,
      smartypants: false,
    });

    this.loadMarkdownFiles();
  },
  updated() {
    // 页面更新后自动为所有 <a> 标签添加 target 和 rel 属性
    this.$nextTick(() => {
      const links = this.$el.querySelectorAll(".markdown-content a");
      links.forEach((link) => {
        if (!link.href.startsWith("mailto:") && !link.href.startsWith("tel:")) {
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener");
        }
      });
    });
  },
};
</script>

<style scoped>
.about-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  transition: background-color 0.3s, color 0.3s;
  position: relative;
  bottom: 10px;
}

.living-glass-panel {
  display: flex;
  width: 1170px;
  height: 680px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  position: relative;
}

/* 侧边栏样式 */
.sidebar {
  width: 170px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding: 30px 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start; /* 关键：从顶部开始排列 */
  align-items: stretch;
  overflow-y: auto; /* 可选：加滚动条 */
}


.light .sidebar {
  background: rgba(255, 255, 255, 0.7);
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}

.sidebar-item {
  padding: 15px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.sidebar-item:hover {
  background: rgba(255, 255, 255, 0.15);
}

.light .sidebar-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.sidebar-item.active {
  background: rgba(255, 255, 255, 0.2);
  border-left: 4px solid #4e89ff;
}

.light .sidebar-item.active {
  background: rgba(0, 0, 0, 0.08);
  border-left: 4px solid #4e89ff;
}

.icon {
  font-size: 20px;
  margin-right: 12px;
}

.title {
  font-size: 14px;
  font-weight: 500;
}

/* 内容区域样式 */
.content {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
}

.light .content {
  background: rgba(255, 255, 255, 0.8);
}
</style>

<style>
/* Markdown内容全局样式 */
.markdown-content {
  line-height: 1.7;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4 {
  margin-top: 1.5em;
  margin-bottom: 0.8em;
  position: relative;
  padding-bottom: 0.3em;
}

.light .markdown-content h1,
.light .markdown-content h2,
.light .markdown-content h3,
.light .markdown-content h4 {
  color: #2c3e50;
}

.dark .markdown-content h1,
.dark .markdown-content h2,
.dark .markdown-content h3,
.dark .markdown-content h4 {
  color: #f0f0f0;
}

.markdown-content h1 {
  font-size: 2.2em;
  border-bottom: 2px solid #4e89ff;
}

.markdown-content h2 {
  font-size: 1.8em;
  border-bottom: 1px solid rgba(78, 137, 255, 0.5);
}

.markdown-content h3 {
  font-size: 1.5em;
}

.markdown-content p {
  margin-bottom: 1.2em;
}

.markdown-content ul,
.markdown-content ol {
  margin-bottom: 1.5em;
  padding-left: 1.5em;
}

.markdown-content li {
  margin-bottom: 0.5em;
}

.markdown-content a {
  color: #4e89ff;
  text-decoration: none;
  position: relative;
}

.markdown-content a:after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background: #4e89ff;
  transition: width 0.3s;
}

.markdown-content a:hover:after {
  width: 100%;
}

.markdown-content strong {
  font-weight: 600;
}

.markdown-content code {
  background: rgba(78, 137, 255, 0.15);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: "Fira Code", monospace;
}

.dark .markdown-content code {
  background: rgba(78, 137, 255, 0.2);
}

.markdown-content pre {
  background: rgba(0, 0, 0, 0.08);
  padding: 15px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1.5em 0;
  border-left: 3px solid #4e89ff;
}

.light .markdown-content pre {
  background: rgba(0, 0, 0, 0.03);
}

.markdown-content blockquote {
  border-left: 4px solid #4e89ff;
  padding: 0.5em 1em;
  margin: 1.5em 0;
  background: rgba(78, 137, 255, 0.05);
  border-radius: 0 8px 8px 0;
}

.dark .markdown-content blockquote {
  background: rgba(78, 137, 255, 0.1);
}

.markdown-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
}

.markdown-content th,
.markdown-content td {
  padding: 0.8em;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.light .markdown-content th,
.light .markdown-content td {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.markdown-content th {
  font-weight: 600;
  background: rgba(78, 137, 255, 0.1);
}

.dark .markdown-content th {
  background: rgba(78, 137, 255, 0.15);
}
</style>
