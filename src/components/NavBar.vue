<template>
  <BNavbar v-b-color-mode="corAtual" toggleable="lg" variant="info-subtle">
    <BNavbarToggle
      @click="collapseVisible = !collapseVisible"
      target="nav-collapse"
    />
    <BCollapse id="nav-collapse" is-nav :visible="collapseVisible">
      <BNavbarNav class="w-100 justify-content-around">
        <BNavItem v-if="isAdmin" to="/cadastro-funcionario" tag="router-link"
          >Funcionários</BNavItem>
        <BNavItem v-if="isAdmin" to="/cadastro-cliente" tag="router-link">Clientes</BNavItem>
        <BNavItem to="/cadastro-loja" tag="router-link">Lojas</BNavItem>
        <BNavItem to="/relatorio" tag="router-link">Relatório</BNavItem>
        <BNavItem to="/calculadora" tag="router-link">Calculadora</BNavItem>
        <BNavItem
          @click="emitChangeColor"
          href="javascript:void(0)"
        >
          Modo {{ corAtual == "dark" ? "Escuro" : "Claro" }}
        </BNavItem>
        <BNavItem @click="sair" to="/login" tag="router-link">Sair</BNavItem>
      </BNavbarNav>
    </BCollapse>
  </BNavbar>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, onMounted } from "vue";
import { authFetch, getCurrentUser } from '../api/authFetch';
import {
  vBColorMode,
  BNavbar,
  BNavbarToggle,
  BCollapse,
  BNavbarNav,
  BNavItem,
} from "bootstrap-vue-next";
import { ref } from "vue";

const props = defineProps<{ corAtual: "light" | "dark" }>();

const emit = defineEmits<{
  (e: "update:corAtual", value: "light" | "dark"): void;
}>();

function emitChangeColor() {
  emit("update:corAtual", props.corAtual === "dark" ? "light" : "dark");
}

const collapseVisible = ref(false);
onMounted(() => {
  const user = getCurrentUser();
  console.log(user);
});
const isAdmin = ref(false);
onMounted(async () => {
  const user = getCurrentUser();
  if (user && user.cargo_superior == true) {
    isAdmin.value = true;
  } else {
    isAdmin.value = false;
  }
});
function sair() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
</script>
