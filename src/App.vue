<script setup>
import { ref, computed } from 'vue'
import Minesweeper from './components/Minesweeper.vue';
import Screensaver from './components/Screensaver.vue';
import TheHeader from './components/TheHeader.vue';
import NotFound from './components/NotFound.vue';

const routes = {
  '/': Minesweeper,
  '/screensaver': Screensaver
}

const currentPath = ref(window.location.hash)

window.addEventListener('hashchange', () => {
  currentPath.value = window.location.hash
})

const currentView = computed(() => {
  console.log('manic', currentPath.value)
  return routes[currentPath.value.slice(1) || '/'] || NotFound
})

</script>



<template>
  <TheHeader />
  <component :is="currentView" />
</template>
