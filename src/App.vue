<template>
  <div id="app">
    <ArchivesList />
  </div>
</template>

<script>
import ArchivesList from './components/ArchivesList.vue';

export default {
  components: {
    ArchivesList
  }
}
</script>

<style>
@font-face {
  font-family: 'NotoSansSC';
  src: url('./assets/fonts/NotoSansSC-VariableFont_wght.ttf') format('truetype-variations');
  font-weight: 100 900;
  font-style: normal;
}

::-webkit-scrollbar {
  display: none;
}

body {
  -ms-overflow-style: none;
  scrollbar-width: none;
  font-family: 'NotoSansSC', sans-serif;
}

* {
  margin: 0px;
  padding: 0px
}
</style>