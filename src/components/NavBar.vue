<template>
  <BNavbar v-b-color-mode="corAtual" toggleable="lg" variant="info-subtle">
    <BNavbarToggle
      @click="collapseVisible = !collapseVisible"
      target="nav-collapse"
    />
    <BCollapse id="nav-collapse" is-nav :visible="collapseVisible">
      <BNavbarNav class="w-100 justify-content-around">
        <BNavItem to="/cadastro-funcionario" tag="router-link"
          >Funcionários</BNavItem
        >
        <BNavItem to="/cadastro-cliente" tag="router-link">Clientes</BNavItem>
        <BNavItem to="/cadastro-loja" tag="router-link">Lojas</BNavItem>
        <BNavItem to="/relatorio" tag="router-link">Relatório</BNavItem>
        <BNavItem to="/calculadora" tag="router-link">Calculadora</BNavItem>
      </BNavbarNav>
    </BCollapse>
  </BNavbar>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from "vue";
import {
  vBColorMode,
  BNavbar,
  BNavbarBrand,
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
</script>
