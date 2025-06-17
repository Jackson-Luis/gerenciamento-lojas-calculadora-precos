<template>
  <div>
    <h2>Cadastro de Loja</h2>
    <button class="btn btn-primary mb-3" @click="novo">Novo +</button>
    <form v-if="mostrarForm" @submit.prevent="salvar">
      <div class="mb-2">
        <label>Nome da Loja:</label>
        <input v-model="form.nome" class="form-control" required />
      </div>
      <div class="mb-2">
        <label>Funcionário:</label>
        <select v-model="form.funcionario_id" class="form-control" required>
          <option value="" disabled>Selecione</option>
          <option v-for="f in funcionarios" :key="f.id" :value="f.id">{{ f.nome }}</option>
        </select>
      </div>
      <div class="mb-2">
        <label>Cliente:</label>
        <select v-model="form.cliente_id" class="form-control" required>
          <option value="" disabled>Selecione</option>
          <option v-for="c in clientes" :key="c.id" :value="c.id">{{ c.nome }}</option>
        </select>
      </div>
      <div class="mb-2">
        <label>Anúncios Total:</label>
        <input type="number" v-model.number="form.anuncios_total" class="form-control" />
      </div>
      <div class="mb-2">
        <label>Anúncios Realizados:</label>
        <input type="number" v-model.number="form.anuncios_realizados" class="form-control" />
      </div>
      <div class="mb-2">
        <label>Anúncios Otimizados:</label>
        <input type="number" v-model.number="form.anuncios_otimizados" class="form-control" />
      </div>
      <div class="mb-2">
        <label>Visitas Semana:</label>
        <input type="number" v-model.number="form.visitas_semana" class="form-control" />
      </div>
      <div class="mb-2">
        <label>Produto Mais Visitado:</label>
        <input v-model="form.produto_mais_visitado" class="form-control" />
      </div>
      <div class="mb-2">
        <label>Vendas Total:</label>
        <input type="number" v-model.number="form.vendas_total" class="form-control" />
      </div>
      <button class="btn btn-success" type="submit">{{ form.id ? 'Atualizar' : 'Adicionar' }}</button>
      <button class="btn btn-secondary ms-2" type="button" @click="cancelar">Cancelar</button>
    </form>
    <hr />
    <h3>Lojas</h3>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Funcionário</th>
          <th>Cliente</th>
          <th>Anúncios Total</th>
          <th>Anúncios Realizados</th>
          <th>Anúncios Otimizados</th>
          <th>Visitas Semana</th>
          <th>Produto Mais Visitado</th>
          <th>Vendas Total</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="l in lojas" :key="l.id">
          <td>{{ l.nome }}</td>
          <td>{{ l.funcionario_nome }}</td>
          <td>{{ l.cliente_nome }}</td>
          <td>{{ l.anuncios_total }}</td>
          <td>{{ l.anuncios_realizados }}</td>
          <td>{{ l.anuncios_otimizados }}</td>
          <td>{{ l.visitas_semana }}</td>
          <td>{{ l.produto_mais_visitado }}</td>
          <td>{{ l.vendas_total }}</td>
          <td>
            <button class="btn btn-primary btn-sm" @click="editar(l)">Editar</button>
            <button class="btn btn-danger btn-sm ms-2" @click="excluir(l.id)">Excluir</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Loja {
  id?: number
  nome: string
  funcionario_id: number
  cliente_id: number
  anuncios_total: number
  anuncios_realizados: number
  anuncios_otimizados: number
  visitas_semana: number
  produto_mais_visitado: string
  vendas_total: number
  funcionario_nome?: string
  cliente_nome?: string
}

interface Funcionario {
  id: number
  nome: string
}

interface Cliente {
  id: number
  nome: string
}

const lojas = ref<Loja[]>([])
const funcionarios = ref<Funcionario[]>([])
const clientes = ref<Cliente[]>([])
const form = ref<Loja>({
  nome: '',
  funcionario_id: 0,
  cliente_id: 0,
  anuncios_total: 0,
  anuncios_realizados: 0,
  anuncios_otimizados: 0,
  visitas_semana: 0,
  produto_mais_visitado: '',
  vendas_total: 0
})
const mostrarForm = ref(false)

async function carregar() {
  const [lojasResp, funcsResp, clientesResp] = await Promise.all([
    fetch('http://localhost:3001/lojas'),
    fetch('http://localhost:3001/funcionarios'),
    fetch('http://localhost:3001/clientes')
  ])
  lojas.value = await lojasResp.json()
  funcionarios.value = await funcsResp.json()
  clientes.value = await clientesResp.json()
}

async function salvar() {
  if (form.value.id) {
    await fetch(`http://localhost:3001/lojas/${form.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
  } else {
    await fetch('http://localhost:3001/lojas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
  }
  cancelar()
  await carregar()
}

function novo() {
  limpar()
  mostrarForm.value = true
}

function editar(l: Loja) {
  form.value = { ...l }
  mostrarForm.value = true
}

function cancelar() {
  mostrarForm.value = false
  limpar()
}

async function excluir(id: number) {
  if (confirm('Excluir loja?')) {
    await fetch(`http://localhost:3001/lojas/${id}`, { method: 'DELETE' })
    await carregar()
  }
}

function limpar() {
  form.value = {
    nome: '',
    funcionario_id: 0,
    cliente_id: 0,
    anuncios_total: 0,
    anuncios_realizados: 0,
    anuncios_otimizados: 0,
    visitas_semana: 0,
    produto_mais_visitado: '',
    vendas_total: 0
  }
}

onMounted(carregar)
</script>
