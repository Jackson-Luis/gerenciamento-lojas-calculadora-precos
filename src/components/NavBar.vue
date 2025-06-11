<template>
    <BNavbar v-b-color-mode="'dark'" toggleable="lg" variant="info-subtle">
        <!-- <BNavbarBrand href="/">NavBar</BNavbarBrand> -->
        <BNavbarToggle target="main-navbar-collapse" />
        <BCollapse id="main-navbar-collapse" is-nav>
            <BNavbarNav class="w-100 justify-content-around">
                <BNavItem href="/relatorio">
                    Gerar Relatório
                </BNavItem>
                <BNavItem href="/calculadora">
                    Calculadora
                </BNavItem>
                <BNavItem @click="emitChangeColor">
                    Modo {{ corAtual == 'dark' ? 'Escuro' : 'Claro' }}
                </BNavItem>
            </BNavbarNav>
        </BCollapse>
    </BNavbar>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import {
    vBColorMode,
    BNavbar,
    BNavbarToggle,
    BCollapse,
    BNavbarNav,
    BNavItem,
} from 'bootstrap-vue-next'

const props = defineProps<{ corAtual: 'light' | 'dark' }>()

const emit = defineEmits<{ (e: 'update:corAtual', value: 'light' | 'dark'): void }>()

function emitChangeColor() {
    emit('update:corAtual', props.corAtual === 'dark' ? 'light' : 'dark')
}
</script>