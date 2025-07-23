import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import Relatorio from '../views/RelatorioView.vue'
import Calculadora from '../views/CalculadoraView.vue'
import CadastroCliente from '../views/CadastroCliente.vue'
import CadastroFuncionario from '../views/CadastroFuncionario.vue'
import CadastroLoja from '../views/CadastroLoja.vue'
import Login from '../views/LoginView.vue'
import EmailRecuperarSenha from '../views/EmailRecuperarSenha.vue'
import EmailCadastrarSenha from '../views/EmailCadastrarSenha.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    component: Login
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
    path: '/calculadora-deslogada',
    name: 'calculadoraDeslogada',
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
  {
    path: '/esqueci-senha',
    name: 'esqueci-senha',
    component: EmailRecuperarSenha
  },
  {
    path: '/recuperar-senha',
    name: 'recuperar-senha',
    component: EmailCadastrarSenha
  }
]

const router = createRouter({
  history: createWebHashHistory('/gerenciamento-lojas-calculadora-precos/'), // usa hash mode para evitar problemas de deploy
  routes
})

// Navigation guard para autenticação
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const rotasPublicas = ['login', 'calculadoraDeslogada'];
  if (!rotasPublicas.includes(to.name as string) && !token) {
    // Sempre redireciona para login se não autenticado, mesmo por URL
    next({ name: 'login' });
  } else {
    next();
  }
});

export default router
