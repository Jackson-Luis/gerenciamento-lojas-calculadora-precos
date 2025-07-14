<template>
  <div>
    <h2>Cadastro de Cliente</h2>
    <button class="btn btn-primary mb-3" @click="novo">Novo +</button>
    <form v-if="mostrarForm" @submit.prevent="salvar">
      <div class="mb-2">
        <label>Nome:</label>
        <input v-model="form.nome" class="form-control" required />
      </div>
      <div class="mb-2">
        <label>Telefone:</label>
        <input
          v-model="form.telefone"
          class="form-control"
          @input="maskTelefone"
          maxlength="15"
        />
      </div>
      <button class="btn btn-success" type="submit">{{ form.id ? 'Atualizar' : 'Adicionar' }}</button>
      <button class="btn btn-secondary ms-2" type="button" @click="cancelar">Cancelar</button>
    </form>
    <hr />
    <h3>Clientes</h3>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Telefone</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in clientes" :key="c.id">
          <td>{{ c.nome }}</td>
          <td>{{ c.telefone }}</td>
          <td>
            <button class="btn btn-primary btn-sm" @click="editar(c)">Editar</button>
            <button class="btn btn-danger btn-sm ms-2" @click="excluir(c.id)">Excluir</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { API_URL } from '../api'
import { authFetch } from '../api/authFetch'

interface Cliente {
  id?: number
  nome: string
  telefone: string
}

const clientes = ref<Cliente[]>([])
const form = ref<Cliente>({ nome: '', telefone: '' })
const mostrarForm = ref(false)

async function carregar() {
  const resp = await authFetch(`${API_URL}/clientes`)
  clientes.value = await resp.json()
}

async function salvar() {
  if (form.value.id) {
    await authFetch(`${API_URL}/clientes/${form.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
  } else {
    await authFetch(`${API_URL}/clientes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
  }
  limpar()
  await carregar()
}

function novo() {
  limpar()
  mostrarForm.value = true
}

function editar(c: Cliente) {
  form.value = { ...c }
  mostrarForm.value = true
}

function cancelar() {
  mostrarForm.value = false
  limpar()
}

async function excluir(id: number) {
  if (confirm('Excluir cliente?')) {
    await authFetch(`${API_URL}/clientes/${id}`, { method: 'DELETE' })
    await carregar()
  }
}

function limpar() {
  form.value = { nome: '', telefone: '' }
}

function maskTelefone(e: Event) {
  let v = (e.target as HTMLInputElement).value.replace(/\D/g, '')
  if (v.length > 11) v = v.slice(0, 11)
  if (v.length > 6) {
    v = v.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3')
  } else if (v.length > 2) {
    v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2')
  } else {
    v = v.replace(/^(\d*)/, '($1')
  }
  (e.target as HTMLInputElement).value = v
  form.value.telefone = v
}

onMounted(carregar)
</script>
