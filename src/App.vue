<script setup lang="ts">
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import Home from './views/Home.vue'
</script>

<template>
  <div class="app">
    <Navbar />
    <main>
      <Home />
    </main>
    <Footer />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}
</style>
