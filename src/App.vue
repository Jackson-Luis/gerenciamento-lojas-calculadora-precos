<template>
  <div v-if="!isLoginRoute">
    <NavBar :corAtual="corAtual" @update:corAtual="setCorAtual" />
    <BCard v-b-color-mode="corAtual" class="border-0 rounded-0 min-vh-100">
      <router-view />
    </BCard>
  </div>
  <div v-else>
    <BCard v-b-color-mode="corAtual" class="border-0 rounded-0 min-vh-100">
      <router-view />
      <div v-if="route.path === '/calculadora-deslogada'">
      <br>
        <div class="d-flex align-items-center justify-content-center" style="width: 100%;">
          <BButton @click="acessarLogin" style="width: 200px;" variant="info">Acessar Login</BButton>
        </div>
      </div>
    </BCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import NavBar from './components/NavBar.vue'
import {
  vBColorMode,
  BCard,
  BButton
} from 'bootstrap-vue-next'
import { useRouter, useRoute } from 'vue-router'
import {jwtDecode} from 'jwt-decode';

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

const router = useRouter()
const route = useRoute()

// Computed para saber se está na rota de login
const isLoginRoute = computed(() => {
  // Ajuste conforme o nome ou path da sua rota de login
  return route.name === 'LoginPage' || route.path === '/login' || route.path === '/calculadora-deslogada'
})

function acessarLogin() {
  router.push({ name: 'login' })
}


function checkAuthToken(token: string): boolean {
  if (!token) return false;

  console.log("Verificando token de autenticação:", token);
  console.log(jwtDecode(token))

  interface DecodedToken {
    id: number;
    nome: string;
    email: string;
    cargo_superior: boolean;
    iat: number;
    exp: number;
  }

  const decoded: DecodedToken =  jwtDecode(token);
  const now = Date.now() / 1000;
  return decoded && decoded.exp > now;

}


onMounted(() => {
  carregarCorAtual()
  const timeOutLogin = setTimeout(() => {
  const token = localStorage.getItem('token');
    if (!checkAuthToken(token ?? '')) {
      //localStorage.removeItem('token');
      console.log("Token inválido ou expirado, redirecionando para login");
      acessarLogin();
      clearTimeout(timeOutLogin)
    }
  }, 1000)
})
</script>
