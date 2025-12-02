<template>
  <div
    class="login-view d-flex align-items-stretch min-vh-100"
    style="background: #23272b"
  >
    <!-- Imagem ocupa metade da tela, sempre 100% em altura -->
    <div
      class="login-image d-flex align-items-center justify-content-center"
      style="flex: 1; background: #181a1b"
    >
      <img
        v-if="!isMobile"
        src="@/assets/logoSis.png"
        alt="Logo do sistema"
        style="
          width: 100%;
          height: 660px;
          object-fit: cover;
          object-position: center;
        "
      />
      <img
        v-else
        src="@/assets/logoSis.png"
        alt="Logo do sistema"
        style="
          width: 100%;
          height: 300px;
          width: 200px;
          object-fit: cover;
          object-position: center;
        "
      />
    </div>
    <!-- Formulário ocupa metade da tela, centralizado verticalmente -->
    <div
      class="login-form d-flex align-items-center justify-content-center"
      style="flex: 1"
    >
      <div class="w-100" style="max-width: 350px">
        <h3 class="mb-4 text-center text-white">Realize seu login</h3>
        <form @submit.prevent="login">
          <div class="mb-3">
            <label for="email" class="form-label text-white">Email</label>
            <BFormInput
              type="email"
              id="email"
              v-model="email"
              :state="null"
              required
              placeholder="Email"
            />
          </div>
          <div class="mb-3">
            <label for="password" class="form-label text-white">Senha</label>
            <BFormInput
              v-model="senha"
              id="password"
              type="password"
              :state="null"
              required
              placeholder="Senha"
            />
          </div>
          <div class="d-grid gap-2">
            <BButton type="submit" variant="success" class="w-100">Login</BButton>
            <BButton @click="acessarCalculadora" class="w-100" variant="info">Acessar Calculadora</BButton>
            <BButton @click="abrirModalRecSenha" class="w-100" variant="link">Esqueci minha senha</BButton>
          </div>
        </form>
      </div>
    </div>
    <EmailRecuperarSenha :visivel="mostrar" @fechar="mostrar = false" />
  </div>
</template>

<script setup lang="ts">
import router from "@/router";
import { BFormInput, BButton } from "bootstrap-vue-next";
import { ref, onMounted } from "vue";
import EmailRecuperarSenha from "@/views/emails/EmailRecuperarSenha.vue";

const email = ref("");
const senha = ref("");

const mostrar = ref(false)

const abrirModalRecSenha = () => {
  mostrar.value = true
}

// Responsivo: detecta se está em mobile
const isMobile = ref(false);
function checkMobile() {
  isMobile.value = window.innerWidth <= 900;
}
onMounted(() => {
  checkMobile();
  window.addEventListener("resize", checkMobile);
  localStorage.removeItem("token");
  localStorage.removeItem("user");
});

const login = async () => {
  try {
    const resp = await fetch(`https://gerenciamento-lojas-calculadora-precos.onrender.com/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, senha: senha.value })
    });
    if (!resp.ok) {
      alert('Login inválido');
      return;
    }
    const data = await resp.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user)); // Salva o usuário logado
    router.push('/relatorio');
  } catch (err) {
    alert('Erro ao fazer login');
    console.error(err);
  }
};
// const acessarCalculadora = () => {
//   router.push("/calculadora-deslogada");
// };
</script>

<style>
/* Opcional: ajuste responsivo para telas menores */
@media (max-width: 900px) {
  .login-view {
    flex-direction: column !important;
  }
  .login-image {
    height: 180px !important;
    min-height: unset !important;
  }
  .login-image img {
    height: 180px !important;
    object-fit: cover;
  }
}
</style>
