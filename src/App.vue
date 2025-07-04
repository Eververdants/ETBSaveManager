<script setup>
import { ref } from "vue";
import router from "./router"; // 引入 router 实例
import LivingGlassSidebar from "./components/LG_SideBar.vue";

const handleItemSelected = (item) => {
  console.log('选中的菜单项:', item);

  // 根据 item 值跳转到不同页面
  switch (item) {
    case 'archive':
      router.push('/');
      break;
    case 'new':
      // 如果有新建存档页面，可添加路由路径
      // router.push('/new-archive');
      break;
    case 'expand':
      // router.push('/expand');
      break;
    case 'about':
      router.push('/about');
      break;
    case 'howto':
      router.push('/how2use');
      break;
    case 'settings':
      // router.push('/settings');
      break;
    default:
      router.push('/');
  }
};
</script>

<template>
  <main class="container">
    <LivingGlassSidebar @item-selected="handleItemSelected" />
    <router-view /> <!-- 页面内容显示在这里 -->
  </main>
</template>

<style>
.container {
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}
</style>