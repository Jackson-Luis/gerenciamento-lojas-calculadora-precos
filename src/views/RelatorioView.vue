<template>
  <div class="inicio">
    <h2>Relatório de Lojas</h2>
    <div v-if="loading">Carregando...</div>
    <div v-else>
      <BTable :bordered="true" :outlined="true" :hover="true" :fixed="true" :items="items" :fields="fields" />
      <!-- <div v-for="(loja) in lojas" :key="loja.id" class="mb-3 p-2 border rounded">
        <strong>{{ loja.loja_nome }}</strong> (Cliente: {{ loja.cliente_nome }})<br>
        Anúncios total: {{ loja.anuncios_total }}<br>
        Anúncios realizados: {{ loja.anuncios_realizados }}<br>
        Anúncios otimizados: {{ loja.anuncios_otimizados }}<br>
        Visitas semana: {{ loja.visitas_semana }}<br>
        Produto mais visitado: {{ loja.produto_mais_visitado }}<br>
        Vendas total: {{ loja.vendas_total }}<br>
        <img v-if="loja.imagem" :src="loja.imagem" alt="Imagem" style="max-width:120px;max-height:80px;">
      </div> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { BTable } from 'bootstrap-vue-next'
const fields = [
  'loja_nome',
  'cliente_nome',
  'anuncios_total',
  'anuncios_realizados',
  'anuncios_otimizados',
  'visitas_semana',
  'produto_mais_visitado',
  'vendas_total',
]

interface Loja {
  id: number
  loja_nome: string
  cliente_nome: string
  anuncios_total: number
  anuncios_realizados: number
  anuncios_otimizados: number
  visitas_semana: number
  produto_mais_visitado: string
  vendas_total: number
  imagem?: string
}

const lojas = ref<Loja[]>([])
const loading = ref(true)
let items: Loja[] = []

onMounted(async () => {
  try {
    const resp = await fetch('http://10.129.5.98:3001/lojas')
    lojas.value = await resp.json()
    console.log('lojas', lojas.value)
    items = lojas.value
  } finally {
    loading.value = false
  }
})

console.log('items', items)
// Exemplo de funções para POST, PUT e DELETE (não utilizadas)
async function exemploPostLoja() {
  const novaLoja = {
    cliente_nome: "Maria Souza",
    loja_nome: "Loja Nova",
    anuncios_total: 50,
    anuncios_realizados: 5,
    anuncios_otimizados: 2,
    visitas_semana: 80,
    produto_mais_visitado: "Produto Y",
    vendas_total: 20,
    imagem: null
  }
  await fetch('http://localhost:3001/lojas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(novaLoja)
  })
}

async function exemploPutLoja(index: number) {
  const lojaAtualizada = {
    cliente_nome: "Maria Souza",
    loja_nome: "Loja Atualizada",
    anuncios_total: 60,
    anuncios_realizados: 6,
    anuncios_otimizados: 3,
    visitas_semana: 90,
    produto_mais_visitado: "Produto Z",
    vendas_total: 25,
    imagem: null
  }
  await fetch(`http://localhost:3001/lojas/${index}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lojaAtualizada)
  })
}

async function exemploDeleteLoja(index: number) {
  await fetch(`http://localhost:3001/lojas/${index}`, {
    method: 'DELETE'
  })
}
</script>
