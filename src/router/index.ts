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

// Navigation guard para autenticação e permissão
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const rotasPublicas = ['login', 'calculadoraDeslogada', 'esqueci-senha', 'recuperar-senha'];

  if (!rotasPublicas.includes(to.name as string) && !token) {
    next({ name: 'login' });
    return;
  }

  // Permissões por rota
  const rotaPermissao: Record<string, (user: any) => boolean> = {
    relatorio: (u) => u?.relatorio_liberado || u?.administrador_geral,
    funcionario: (u) => u?.administrador_geral,
    cliente: (u) => u?.administrador_geral,
    loja: (u) => u?.administrador_geral,
    calculadora: (u) => u?.calculadora_liberada || u?.administrador_geral,
    // Outras rotas podem ser adicionadas aqui se necessário
  };

  if (to.name && rotaPermissao[to.name as string]) {
    if (!rotaPermissao[to.name as string](user)) {
      // Redireciona para a primeira rota que o usuário tem permissão
      if (user?.administrador_geral) {
        next({ name: 'relatorio' });
      } else if (user?.relatorio_liberado) {
        next({ name: 'relatorio' });
      } else if (user?.calculadora_liberada) {
        next({ name: 'calculadora' });
      } else {
        next({ name: 'login' });
      }
      return;
    }
  }

  next();
});

export default router
