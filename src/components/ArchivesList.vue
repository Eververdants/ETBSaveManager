<template>
  <!-- 编辑图标 -->
  <svg style="display:none;">
    <symbol id="Edit" viewBox="0 -960 960 960">
      <path
        d="M200-200h57l391-391-57-57-391 391v57Zm-40 80q-17 0-28.5-11.5T120-160v-97q0-16 6-30.5t17-25.5l505-504q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L313-143q-11 11-25.5 17t-30.5 6h-97Zm600-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
    </symbol>
  </svg>

  <!-- 可视图标 -->
  <svg style="display:none;">
    <symbol id="Visibility" viewBox="0 -960 960 960">
      <path
        d="M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-134 0-244.5-72T61-462q-5-9-7.5-18.5T51-500q0-10 2.5-19.5T61-538q64-118 174.5-190T480-800q134 0 244.5 72T899-538q5 9 7.5 18.5T909-500q0 10-2.5 19.5T899-462q-64 118-174.5 190T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z" />
    </symbol>
  </svg>

  <!-- 不可视图标 -->
  <svg style="display:none;">
    <symbol id="VisibilityOff" viewBox="0 -960 960 960">
      <path
        d="M607-627q29 29 42.5 66t9.5 76q0 15-11 25.5T622-449q-15 0-25.5-10.5T586-485q5-26-3-50t-25-41q-17-17-41-26t-51-4q-15 0-25.5-11T430-643q0-15 10.5-25.5T466-679q38-4 75 9.5t66 42.5Zm-127-93q-19 0-37 1.5t-36 5.5q-17 3-30.5-5T358-742q-5-16 3.5-31t24.5-18q23-5 46.5-7t47.5-2q137 0 250.5 72T904-534q4 8 6 16.5t2 17.5q0 9-1.5 17.5T905-466q-18 40-44.5 75T802-327q-12 11-28 9t-26-16q-10-14-8.5-30.5T753-392q24-23 44-50t35-58q-50-101-144.5-160.5T480-720Zm0 520q-134 0-245-72.5T60-463q-5-8-7.5-17.5T50-500q0-10 2-19t7-18q20-40 46.5-76.5T166-680l-83-84q-11-12-10.5-28.5T84-820q11-11 28-11t28 11l680 680q11 11 11.5 27.5T820-84q-11 11-28 11t-28-11L624-222q-35 11-71 16.5t-73 5.5ZM222-624q-29 26-53 57t-41 67q50 101 144.5 160.5T480-280q20 0 39-2.5t39-5.5l-36-38q-11 3-21 4.5t-21 1.5q-75 0-127.5-52.5T300-500q0-11 1.5-21t4.5-21l-84-82Zm319 93Zm-151 75Z" />
    </symbol>
  </svg>

  <!-- 删除图标 -->
  <svg style="display:none;">
    <symbol id="Delete" viewBox="0 -960 960 960">
      <path
        d="M280-120q-33 0-56.5-23.5T200-200v-520q-17 0-28.5-11.5T160-760q0-17 11.5-28.5T200-800h160q0-17 11.5-28.5T400-840h160q17 0 28.5 11.5T600-800h160q17 0 28.5 11.5T800-760q0 17-11.5 28.5T760-720v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520Zm-400 0v520-520Zm200 316 76 76q11 11 28 11t28-11q11-11 11-28t-11-28l-76-76 76-76q11-11 11-28t-11-28q-11-11-28-11t-28 11l-76 76-76-76q-11-11-28-11t-28 11q-11 11-11 28t11 28l76 76-76 76q-11 11-11 28t11 28q11 11 28 11t28-11l76-76Z" />
    </symbol>
  </svg>

  <div class="container">
    <!-- 加载中显示加载动画 -->
    <LoadingAnimation v-if="loading" />

    <!-- 为每个存档生成一个卡片 -->
    <transition-group name="archive-list" tag="div" class="archive-list-container" v-if="!loading">
      <div v-for="(archive, index) in archives" :key="index" class="contentbox" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
        <div class="title">
          <h2>{{ archive.game_name }}</h2>
        </div>

      <div class="info-list">
        <div class="info-item">
          <span class="label">{{ $t('archive_difficulty') }}</span>
          <span class="value">{{ $t(archive.game_difficulty) }}</span>
        </div>

        <div class="info-item">
          <span class="label">{{ $t('actual_difficulty') }}</span>
          <span class="value">{{ $t(archive.actual_difficulty) }}</span>
        </div>

        <div class="info-item">
          <span class="label">{{ $t('archive_mode') }}</span>
          <span class="value">{{ $t(archive.game_mode) }}</span>
        </div>
      </div>

      <div class="VorF">
        <svg class="icon">
          <use :xlink:href="archive.is_in_subfolder ? '#VisibilityOff' : '#Visibility'"></use>
        </svg>
      </div>

      <div class="icon-box">
        <button class="edit" @click="editArchive(archive)">
          <svg class="icon">
            <use xlink:href="#Edit"></use>
          </svg>
        </button>

        <button class="delete" @click="deleteArchive(archive)">
          <svg class="icon">
            <use xlink:href="#Delete"></use>
          </svg>
        </button>

        <button class="visibility-or-off" @click="toggleArchiveVisibility(archive)">
          <svg class="icon">
            <use :xlink:href="archive.is_in_subfolder ? '#VisibilityOff' : '#Visibility'"></use>
          </svg>
        </button>
      </div>
    </div>
    </transition-group>
    
    <!-- 如果没有存档，显示提示信息 -->
    <div v-if="archives.length === 0 && !loading" class="no-archives">
      <p>{{ $t('no_archives_found') || '未找到存档' }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import LoadingAnimation from './LoadingAnimation.vue';

// 存档列表
const archives = ref([]);
// 加载状态
const loading = ref(true);
// 错误信息
const error = ref(null);

// 鼠标进入事件处理
const handleMouseEnter = () => {
  // 鼠标进入卡片时的逻辑
};

// 鼠标离开事件处理
const handleMouseLeave = () => {
  // 鼠标离开卡片时的逻辑
};

// 编辑存档
const editArchive = (archive) => {
  console.log('编辑存档:', archive);
  // 实现编辑存档的逻辑
};

// 删除存档
const deleteArchive = (archive) => {
  console.log('删除存档:', archive);
  // 实现删除存档的逻辑
};

// 切换存档可见性
const toggleArchiveVisibility = (archive) => {
  console.log('切换存档可见性:', archive);
  archive.visible = !archive.visible;
};

// 调用 get_save_games 函数获取存档列表
const fetchSaveGames = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    // 取消注释以延长加载时间，方便测试加载动画
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result = await invoke('get_save_games');
    console.log('存档列表:', result);
    
    // 将返回的存档列表赋值给 archives
    archives.value = result;
  } catch (err) {
    console.error('获取存档列表时出错:', err);
    error.value = err.toString();
  } finally {
    loading.value = false;
    
    // 加载完成后滚动到页面顶部
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // 使用平滑滚动效果
    });
  }
};

// 在组件挂载时调用 get_save_games
onMounted(() => {
  fetchSaveGames();
});

// 组件卸载时确保恢复滚动
onUnmounted(() => {
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
  document.body.style.height = '';
  document.documentElement.style.overflow = '';
});
</script>

<style scoped>
/* 无存档时的样式 */
.no-archives {
  width: 100%;
  padding: 50px;
  text-align: center;
  font-size: 1.2rem;
  color: #777;
}

/* 按钮 */
button {
  cursor: pointer;
}

/* 容器 */
.container {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  position: relative;
  min-height: 300px; /* 确保有足够的高度显示加载动画 */
}

/* 卡片 */
.contentbox {
  cursor: default;
  width: 288px;
  height: 252px;
  margin: 21px;
  position: relative;
  display: inline-block;
  box-shadow: 5px 5px 10px 0px lightgray;
  border-radius: 10px;
  will-change: transform, box-shadow;
  transition:
    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backface-visibility: hidden;
  transform-style: preserve-3d;
  perspective: 1000px;
}

/* 存档名称 */
.contentbox .title h2 {
  color: black;
  margin: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 1.45rem;
  font-weight: 800;
  transform: translateZ(0);
}

/* 存档信息列表 */
.contentbox .info-list {
  margin: 18px;
  margin-bottom: 0px;
  font-weight: 400;
  overflow-y: auto;
  transform: translateZ(0);
}

/* 存档信息列表项 */
.contentbox .info-list .info-item {
  position: relative;
  justify-content: center;
  margin-bottom: 18px;
  font-size: 1.1rem;
  width: auto;
  color: gray;
  align-items: center;
}

/* 固定下划线 */
.contentbox .info-list .info-item::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -5px;
  width: 94%;
  height: 1.5px;
  background: hsla(0, 0%, 0%, 0.185);
}

/* 存档可视性图标 */
.contentbox .VorF svg {
  width: 35px;
  height: 35px;
  position: absolute;
  right: 20px;
  bottom: 10px;
  opacity: 1;
  transition: all 0.2s ease;
}

/* 鼠标悬浮卡片时动画-存档可视性图标 */
.contentbox:hover .VorF svg {
  opacity: 0;
}

/* 存档信息列表项值 */
.contentbox .info-list .info-item .value {
  position: absolute;
  right: 20px;
}

/* 操作按钮盒 */
.contentbox .icon-box {
  margin: 20px;
  margin-top: 0px;
}

/* 操作按钮图标 */
.contentbox .icon-box svg {
  width: 30px;
  height: 30px;
}

/* 鼠标悬浮卡片时动画-卡片 */
.contentbox:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

/* 操作按钮盒按钮 */
.contentbox .icon-box button {
  cursor: pointer;
  margin-right: 10px;
  border: none;
  border-radius: 50%;
  width: 45px;
  height: 45px;
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease,
    box-shadow 0.3s ease,
    background-color 0.3s ease;
}

/* 编辑按钮 */
.contentbox .icon-box .edit {
  background-color: #2196F3;
}

/* 删除按钮 */
.contentbox .icon-box .delete {
  background-color: #E74C3C;
}

/* 可视性按钮 */
.contentbox .icon-box .visibility-or-off {
  background-color: #777777; 
}

/* 编辑、删除、可视性按钮 */
.contentbox .icon-box .edit,
.contentbox .icon-box .delete,
.contentbox .icon-box .visibility-or-off  {
  opacity: 0;
}

/* 鼠标悬浮卡片时动画-编辑、删除、可视性按钮 */
.contentbox:hover .icon-box .edit,
.contentbox:hover .icon-box .delete,
.contentbox:hover .icon-box .visibility-or-off {
  opacity: 1;
}

/* 鼠标悬浮卡片、编辑按钮时动画-编辑按钮 */
.contentbox:hover .icon-box .edit:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(33, 150, 243, 0.3);
}

/* 鼠标悬浮卡片、删除按钮时动画-删除按钮 */
.contentbox:hover .icon-box .delete:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(231, 76, 60, 0.3);
}

/* 鼠标悬浮卡片、删除按钮时动画-删除按钮 */
.contentbox:hover .icon-box .visibility-or-off:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(110, 110, 110, 0.555);
}

/* 显示或隐藏按钮图标 */
.contentbox .icon-box .visibility-or-off svg {
  position: relative;
  top: 2px;
}

/* 删除按钮图标 */
.contentbox .icon-box .delete svg {
  position: relative;
  top: 1px;
  left: 0.5px;
}

/* 存档列表容器 */
.archive-list-container {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

/* 存档列表动画 */
.archive-list-enter-active {
  transition: all 0.5s ease;
}

.archive-list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.archive-list-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.archive-list-move {
  transition: transform 0.5s ease;
}

/* 为每个卡片添加延迟，创造级联效果 */
.contentbox {
  animation: fade-in-up 0.6s ease backwards;
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 为每个卡片设置不同的动画延迟 */
.contentbox:nth-child(1) { animation-delay: 0.1s; }
.contentbox:nth-child(2) { animation-delay: 0.2s; }
.contentbox:nth-child(3) { animation-delay: 0.3s; }
.contentbox:nth-child(4) { animation-delay: 0.4s; }
.contentbox:nth-child(5) { animation-delay: 0.5s; }
.contentbox:nth-child(6) { animation-delay: 0.6s; }
.contentbox:nth-child(7) { animation-delay: 0.7s; }
.contentbox:nth-child(8) { animation-delay: 0.8s; }
.contentbox:nth-child(9) { animation-delay: 0.9s; }
.contentbox:nth-child(n+10) { animation-delay: 1s; }

/* 鼠标悬浮卡片时动画-卡片 */
.contentbox:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

/* 操作按钮盒按钮 */
.contentbox .icon-box button {
  cursor: pointer;
  margin-right: 10px;
  border: none;
  border-radius: 50%;
  width: 45px;
  height: 45px;
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease,
    box-shadow 0.3s ease,
    background-color 0.3s ease;
}

/* 编辑按钮 */
.contentbox .icon-box .edit {
  background-color: #2196F3;
}

/* 删除按钮 */
.contentbox .icon-box .delete {
  background-color: #E74C3C;
}

/* 可视性按钮 */
.contentbox .icon-box .visibility-or-off {
  background-color: #777777; 
}

/* 编辑、删除、可视性按钮 */
.contentbox .icon-box .edit,
.contentbox .icon-box .delete,
.contentbox .icon-box .visibility-or-off  {
  opacity: 0;
}

/* 鼠标悬浮卡片时动画-编辑、删除、可视性按钮 */
.contentbox:hover .icon-box .edit,
.contentbox:hover .icon-box .delete,
.contentbox:hover .icon-box .visibility-or-off {
  opacity: 1;
}

/* 鼠标悬浮卡片、编辑按钮时动画-编辑按钮 */
.contentbox:hover .icon-box .edit:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(33, 150, 243, 0.3);
}

/* 鼠标悬浮卡片、删除按钮时动画-删除按钮 */
.contentbox:hover .icon-box .delete:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(231, 76, 60, 0.3);
}

/* 鼠标悬浮卡片、删除按钮时动画-删除按钮 */
.contentbox:hover .icon-box .visibility-or-off:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(110, 110, 110, 0.555);
}

/* 显示或隐藏按钮图标 */
.contentbox .icon-box .visibility-or-off svg {
  position: relative;
  top: 2px;
}

/* 删除按钮图标 */
.contentbox .icon-box .delete svg {
  position: relative;
  top: 1px;
  left: 0.5px;
}
</style>