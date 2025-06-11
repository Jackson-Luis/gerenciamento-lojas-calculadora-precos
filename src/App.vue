<template>
  <NavBar :corAtual="corAtual" @update:corAtual="setCorAtual" />
  <BCard v-b-color-mode="corAtual" class="border-0 rounded-0 min-vh-100 min-vw-100">
    <router-view />
  </BCard>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NavBar from './components/NavBar.vue'
import {
  vBColorMode,
  BCard
} from 'bootstrap-vue-next'

const corAtual = ref<'light' | 'dark'>('dark')

function detectarTemaSistema(): 'light' | 'dark' {
 
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

function carregarCorAtual() {
  const salva = localStorage.getItem('corAtual')
  if (salva === 'light' || salva === 'dark') {
    corAtual.value = salva
  } else {
    corAtual.value = detectarTemaSistema()
  }
}

function setCorAtual(novaCor: 'light' | 'dark') {
  corAtual.value = novaCor
  localStorage.setItem('corAtual', novaCor)
}

onMounted(() => {
  carregarCorAtual()
})
</script>

<!-- <style scoped lang="scss">
// #app {
//   font-family: Avenir, Helvetica, Arial, sans-serif;
//   -webkit-font-smoothing: antialiased;
//   -moz-osx-font-smoothing: grayscale;
//   text-align: center;
//   color: #1c89f5;
// }
</style> -->
