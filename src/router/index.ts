import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import Relatorio from '../views/RelatorioView.vue'
import Calculadora from '../views/CalculadoraView.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/relatorio'
  },
  {
    path: '/relatorio',
    name: 'relatorio',
    component: Relatorio
  },
  {
    path: '/calculadora',
    name: 'calculadora',
    component: Calculadora
  },
]

const router = createRouter({
  history: createWebHashHistory('/gerenciamento-lojas-calculadora-precos/'), // usa hash mode para evitar problemas de deploy
  routes
})

export default router
