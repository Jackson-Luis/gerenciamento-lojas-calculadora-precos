<template>
  <BNavbar v-b-color-mode="corAtual" toggleable="lg" variant="info-subtle">
    <BNavbarToggle
      @click="collapseVisible = !collapseVisible"
      target="nav-collapse"
    />
    <BCollapse id="nav-collapse" is-nav :visible="collapseVisible">
      <BNavbarNav class="w-100 justify-content-around">
        <BNavItem v-if="isAdmin" to="/cadastro-funcionario" tag="router-link"
          >Funcionários</BNavItem
        >
        <BNavItem v-if="isAdmin" to="/cadastro-cliente" tag="router-link"
          >Clientes</BNavItem
        >
        <BNavItem v-if="isAdmin" to="/cadastro-loja" tag="router-link"
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
    @success="showToast('Senha alterada com sucesso!', 'success')"
  />
</template>

<script setup lang="ts">
import { ref, computed, defineEmits, defineProps } from "vue";
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
</script>
  