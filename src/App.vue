<script setup>
import { ref } from "vue";
import Home from "./views/Home.vue";
import LivingGlassSidebar from "./components/LG_SideBar.vue"; // 修改为正确变量名

// 组件内方法可以直接定义为函数
const handleItemSelected = (item) => {
  console.log('选中的菜单项:', item);
  // 在这里处理页面跳转或内容更新
};
</script>

<template>
  <main class="container">
    <LivingGlassSidebar @item-selected="handleItemSelected" />
    <Home></Home>
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