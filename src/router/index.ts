import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import Relatorio from '../views/RelatorioView.vue'
import Calculadora from '../views/CalculadoraView.vue'
import Cliente from '../views/cliente/ListaCliente.vue'
import Funcionario from '../views/funcionario/ListaFuncionario.vue'
import Loja from '../views/loja/ListaLoja.vue'
import Login from '../views/LoginView.vue'
import EmailRecuperarSenha from '../views/emails/EmailRecuperarSenha.vue'
import EmailCadastrarSenha from '../views/emails/EmailCadastrarSenha.vue'
import TesteIA from '../views/TesteIa.vue'

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
  // {
  //   path: '/calculadora-deslogada',
  //   name: 'calculadoraDeslogada',
  //   component: Calculadora
  // },
  {
    path: '/cliente',
    name: 'cliente',
    component: Cliente
  },
  {
    path: '/funcionario',
    name: 'funcionario',
    component: Funcionario
  },
  {
    path: '/loja',
    name: 'loja',
    component: Loja
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
  },
  {
    path: '/criacao-ia',
    name: 'criacao-ia',
    component: TesteIA
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
