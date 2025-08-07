<template>
  <BNavbar v-b-color-mode="corAtual" toggleable="lg" variant="info-subtle">
    <BNavbarToggle
      @click="collapseVisible = !collapseVisible"
      target="nav-collapse"
    />
    <BCollapse id="nav-collapse" is-nav :visible="collapseVisible">
      <BNavbarNav class="w-100 justify-content-around">
        <BNavItem v-if="isAdmin" to="/funcionario" tag="router-link"
          >Funcionários</BNavItem
        >
        <BNavItem v-if="isAdmin" to="/cliente" tag="router-link"
          >Clientes</BNavItem
        >
        <BNavItem v-if="isAdmin" to="/loja" tag="router-link"
          >Lojas</BNavItem
        >

        <BNavItem to="/relatorio" tag="router-link">Relatório</BNavItem>

        <BNavItem to="/criacao-ia" tag="router-link">Criação com IA (Experimental incompleta)</BNavItem>
        
        <BNavItem to="/calculadora" tag="router-link">Calculadora</BNavItem>
        <BNavItem @click="emitChangeColor" href="javascript:void(0)">
          Modo {{ corAtual == "dark" ? "Escuro" : "Claro" }}
        </BNavItem>

        <BNavItemDropdown>
          <template #button-content>
            <em>Config</em>
          </template>
          <BDropdownItem @click="openPasswordModal"
            >Alterar senha</BDropdownItem
          >
          <BDropdownItem tag="router-link" to="/login" @click="logout"
            >Sair</BDropdownItem
          >
        </BNavItemDropdown>
      </BNavbarNav>
    </BCollapse>
  </BNavbar>

  <ModalSenha
    v-model="showPasswordModal"
    @success="toast('Senha alterada com sucesso!', 'success')"
  />
</template>

<script setup lang="ts">
import { ref, computed, defineEmits, defineProps, onBeforeMount } from "vue";
import {
  vBColorMode,
  BNavbar,
  BNavbarToggle,
  BCollapse,
  BNavbarNav,
  BNavItem,
  BNavItemDropdown,
  BDropdownItem,
} from "bootstrap-vue-next";
import ModalSenha from "@/components/ModalSenha.vue";
import { getCurrentUser } from "@/api/authFetch";
import { useToastAlert } from "@/composables/useToastAlert";
import { useRouter, useRoute } from 'vue-router'
import {jwtDecode} from 'jwt-decode';


const router = useRouter()
const route = useRoute()

const props = defineProps<{ corAtual: "light" | "dark" }>();
const emit = defineEmits<{
  (e: "update:corAtual", value: "light" | "dark"): void;
}>();

const collapseVisible = ref(false);
const showPasswordModal = ref(false);
const { showToast: toast } = useToastAlert();

const currentUser = computed(() => getCurrentUser());
const isAdmin = computed(() => !!currentUser.value?.cargo_superior);

function emitChangeColor() {
  emit("update:corAtual", props.corAtual === "dark" ? "light" : "dark");
}

function openPasswordModal() {
  showPasswordModal.value = true;
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

async function checkAuthToken(token: string): Promise<boolean> {
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
   console.log(jwtDecode(token))
  const now = Date.now() / 1000;
   console.log(jwtDecode(token))
  return decoded && decoded.exp > now;

}


await onBeforeMount(() => {
  const timeOutLogin = setTimeout(async () => {
  const token = localStorage.getItem('token');
    if (!await checkAuthToken(token ?? '')) {
      //localStorage.removeItem('token');
      console.log("Token inválido ou expirado, redirecionando para login");
      router.push({ name: 'login' })
      clearTimeout(timeOutLogin)
    }
  }, 1000)
})
</script>
  