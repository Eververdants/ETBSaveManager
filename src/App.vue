<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import router from "./router"; // 引入 router 实例
import LivingGlassSidebar from "./components/LG_SideBar.vue";

const currentTheme = ref("CloudGlow");

onMounted(() => {
  document.documentElement.classList.add(currentTheme.value);
});

const handleItemSelected = (item) => {
  console.log("选中的菜单项:", item);

  // 根据 item 值跳转到不同页面
  switch (item) {
    case "archive":
      router.push("/");
      break;
    case "new":
      router.push("/createarchive");
      break;
    case "expand":
      router.push("/additionalcontent");
      break;
    case "about":
      router.push("/about");
      break;
    case "howto":
      router.push("/how2use");
      break;
    case "settings":
      router.push("/settings");
      break;
    default:
      router.push("/");
  }
};

// 定义为响应式函数以便在添加和移除时引用同一个
const preventNavigate = (event) => {
  history.pushState(null, null, window.location.pathname);
  event.preventDefault();
};

onMounted(() => {
  window.history.pushState(null, null, window.location.pathname);
  window.addEventListener("popstate", preventNavigate);
});

onBeforeUnmount(() => {
  window.removeEventListener("popstate", preventNavigate);
});
</script>

<template>
  <main class="container" :class="currentTheme">
    <div class="sidebar">
      <LivingGlassSidebar @item-selected="handleItemSelected" />
    </div>
    <div class="view">
      <router-view />
    </div>
  </main>
</template>

<style>
.container {
  margin: 0;
  display: flex;
  flex-direction: row;
  text-align: left; /* 可根据需要调整文本对齐方式 */
}

.sidebar {
  width: 60px;
  height: 100vh;
}

.view {
  flex: 1;
}
</style>
