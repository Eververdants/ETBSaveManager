<script setup>
import { ref, onMounted } from "vue";
import router from "./router";
import Sidebar from "./components/LG_SideBar.vue";

const currentTheme = ref("CloudGlow");

onMounted(() => {
  document.documentElement.classList.add(currentTheme.value);
});

const handleItemSelected = (item) => {
  console.log("选中的菜单项:", item);

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
</script>

<template>
  <main class="container" :class="currentTheme">
    <div class="sidebar">
      <Sidebar @item-selected="handleItemSelected" />
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
}

.sidebar {
  width: 60px;
  height: 100vh;
}

.view {
  flex: 1;
}
</style>