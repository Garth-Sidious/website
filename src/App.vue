<script setup>
import { ref, computed } from 'vue'
import Minesweeper from './components/Minesweeper.vue';
import Chromatica from './components/Chromatica.vue';
import Screensaver from './components/Screensaver.vue';
import NotFound from './components/NotFound.vue';
import "bootstrap/dist/css/bootstrap.min.css"
import 'bootstrap/dist/js/bootstrap.min.js'
import "bootstrap"

const routes = {
  '/': { view: Minesweeper, text: 'Minesweeper' },
  '/chromatica': { view: Chromatica, text: 'Chromatica' },
  '/screensaver': { view: Screensaver, text: 'Screensaver' }
}

const currentPath = ref(window.location.hash)

window.addEventListener('hashchange', () => {
  currentPath.value = window.location.hash
})

const currentView = computed(() => {
  return routes[currentPath.value.slice(1) || '/']?.view || NotFound
})

const currentPage = computed(() => {
  return currentPath.value.slice(1) || '/'
})

</script>

<template>
   <header class="d-flex justify-content-center py-3 text-bg-dark header">
    <ul class="nav nav-pills">
      <template v-for="(info, route) of routes">
        <li v-if="currentPage === route" class="nav-item"><a :href="'#' + route" class="nav-link active" aria-current="page">{{ info.text }}</a></li>
        <li v-else class="nav-item"><a :href="'#' + route" class="nav-link">{{ info.text }}</a></li>
      </template>
    </ul>
  </header>
  <component :is="currentView" />
</template>
