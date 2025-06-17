import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import Relatorio from '../views/RelatorioView.vue'
import Calculadora from '../views/CalculadoraView.vue'
import CadastroCliente from '../views/CadastroCliente.vue'
import CadastroFuncionario from '../views/CadastroFuncionario.vue'
import CadastroLoja from '../views/CadastroLoja.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/calculadora'
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
  {
    path: '/cadastro-cliente',
    name: 'cadastro-cliente',
    component: CadastroCliente
  },
  {
    path: '/cadastro-funcionario',
    name: 'cadastro-funcionario',
    component: CadastroFuncionario
  },
  {
    path: '/cadastro-loja',
    name: 'cadastro-loja',
    component: CadastroLoja
  },
]

const router = createRouter({
  history: createWebHashHistory('/gerenciamento-lojas-calculadora-precos/'), // usa hash mode para evitar problemas de deploy
  routes
})

export default router
