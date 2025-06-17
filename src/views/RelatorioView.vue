<template>
  <div class="inicio">
    <h2>Relatório de Lojas</h2>
    <div v-if="loading">Carregando...</div>
    <div v-else>
      <BTable
        v-if="lojas.length"
        :bordered="true"
        :outlined="true"
        :hover="true"
        :fixed="true"
        :items="lojas"
        :fields="fields"
      >
        <template #cell(funcionario_nome)="{ item }">
          {{ item.funcionario_nome }}
        </template>
        <template #cell(cliente_nome)="{ item }">
          {{ item.cliente_nome }}
        </template>
        <template #cell(nome)="{ item }">
          {{ item.nome }}
        </template>
        <template #cell(anuncios_total)="{ item }">
          <input type="number" v-model.number="item.anuncios_total" @blur="atualizarLoja(item)" class="form-control form-control-sm" />
        </template>
        <template #cell(anuncios_realizados)="{ item }">
          <input type="number" v-model.number="item.anuncios_realizados" @blur="atualizarLoja(item)" class="form-control form-control-sm" />
        </template>
        <template #cell(anuncios_otimizados)="{ item }">
          <input type="number" v-model.number="item.anuncios_otimizados" @blur="atualizarLoja(item)" class="form-control form-control-sm" />
        </template>
        <template #cell(visitas_semana)="{ item }">
          <input type="number" v-model.number="item.visitas_semana" @blur="atualizarLoja(item)" class="form-control form-control-sm" />
        </template>
        <template #cell(produto_mais_visitado)="{ item }">
          <input v-model="item.produto_mais_visitado" @blur="atualizarLoja(item)" class="form-control form-control-sm" />
        </template>
        <template #cell(vendas_total)="{ item }">
          <input type="number" v-model.number="item.vendas_total" @blur="atualizarLoja(item)" class="form-control form-control-sm" />
        </template>
      </BTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { BTable } from "bootstrap-vue-next";
import { API_URL } from '../api'

const fields = [
  { key: "funcionario_nome", label: "Funcionário" },
  { key: "cliente_nome", label: "Cliente" },
  { key: "nome", label: "Loja" },
  "anuncios_total",
  "anuncios_realizados",
  "anuncios_otimizados",
  "visitas_semana",
  "produto_mais_visitado",
  "vendas_total"
];

interface Loja {
  id: number;
  funcionario_nome: string;
  cliente_nome: string;
  nome: string;
  anuncios_total: number;
  anuncios_realizados: number;
  anuncios_otimizados: number;
  visitas_semana: number;
  produto_mais_visitado: string;
  vendas_total: number;
}

const lojas = ref<Loja[]>([]);
const loading = ref(true);

async function carregarLojas() {
  loading.value = true;
  try {
    const resp = await fetch(`${API_URL}/lojas`);
    lojas.value = await resp.json();
  } finally {
    loading.value = false;
  }
}

async function atualizarLoja(loja: Loja) {
  await fetch(`${API_URL}/lojas/${loja.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(loja)
  });
}

onMounted(carregarLojas);
</script>
