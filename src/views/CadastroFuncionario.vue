<template>
  <div>
    <h2>Cadastro de Funcionário</h2>
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
    <h3>Funcionários</h3>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Telefone</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="f in funcionarios" :key="f.id">
          <td>{{ f.nome }}</td>
          <td>{{ f.telefone }}</td>
          <td>
            <button class="btn btn-primary btn-sm" @click="editar(f)">Editar</button>
            <button class="btn btn-danger btn-sm ms-2" @click="excluir(f.id)">Excluir</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Funcionario {
  id?: number
  nome: string
  telefone: string
}

const funcionarios = ref<Funcionario[]>([])
const form = ref<Funcionario>({ nome: '', telefone: '' })
const mostrarForm = ref(false)

async function carregar() {
  const resp = await fetch('http://localhost:3001/funcionarios')
  funcionarios.value = await resp.json()
}

async function salvar() {
  if (form.value.id) {
    await fetch(`http://localhost:3001/funcionarios/${form.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
  } else {
    await fetch('http://localhost:3001/funcionarios', {
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

function editar(f: Funcionario) {
  form.value = { ...f }
  mostrarForm.value = true
}

function cancelar() {
  mostrarForm.value = false
  limpar()
}

async function excluir(id: number) {
  if (confirm('Excluir funcionário?')) {
    await fetch(`http://localhost:3001/funcionarios/${id}`, { method: 'DELETE' })
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
