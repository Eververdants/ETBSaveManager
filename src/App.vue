<script setup>
import { ref } from "vue";
import Home from "./views/Home.vue";
</script>

<template>
  <main class="container">
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
