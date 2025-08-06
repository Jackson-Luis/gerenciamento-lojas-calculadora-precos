<template>
  <div>
    <div class="d-flex justify-content-between">
      <h3>Lista de Clientes</h3>
      <button class="btn btn-primary mb-3" @click="novo">Novo +</button>
    </div>
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
            <BDropdown
              size="lg"
              variant="link"
              toggle-class="text-decoration-none"
              no-caret
            >
            <template #button-content>&#x2630;<span class="visually-hidden">Ações</span> </template>
                <BDropdownItem @click="editar(c)">Editar</BDropdownItem>
                <BDropdownItem @click="excluir(c.id!)">Excluir</BDropdownItem>
            </BDropdown>
          </td>
        </tr>
      </tbody>
    </table>
    <BModal v-model="showConfirmModal" title="Confirmar exclusão" ok-title="Excluir" cancel-title="Cancelar" @ok="confirmarExclusao">
      Tem certeza que deseja excluir este cliente?
    </BModal>
    <ToastAlert :message="toastMsg" :type="toastType" />
    <ModalCliente v-model="showModal" :edicao-cliente="editarCliente" @success="carregar" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authFetch } from '@/api/authFetch'
import { BModal, BDropdown, BDropdownItem } from 'bootstrap-vue-next'
import ToastAlert from '@/components/ToastAlert.vue'
import { useToastAlert } from '@/composables/useToastAlert'
import ModalCliente from './ModalCliente.vue'

interface Cliente {
  id?: number
  nome: string
  telefone: string
}

const clientes = ref<Cliente[]>([])
const form = ref<Cliente>({ nome: '', telefone: '' })
const showConfirmModal = ref(false)
const idParaExcluir = ref<number | null>(null)
const showModal = ref(false)
const editarCliente = ref<Cliente | null>(null)
const { toastMsg, toastType, showToast } = useToastAlert()

async function carregar() {
  console.log('Carregando clientes')
  const resp = await authFetch(`https://gerenciamento-lojas-calculadora-precos.onrender.com/clientes`);
  clientes.value = await resp.json();
  clientes.value.sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? ''));
}

function novo() {
  showModal.value = true
  editarCliente.value = null
}

function editar(c: Cliente) {
  editarCliente.value = { ...c }
  showModal.value = true
}

async function excluir(id: number) {
  idParaExcluir.value = id
  showConfirmModal.value = true
}

async function confirmarExclusao() {
  if (idParaExcluir.value !== null) {
    await authFetch(`https://gerenciamento-lojas-calculadora-precos.onrender.com/clientes/${idParaExcluir.value}`, { method: 'DELETE' });
    await carregar();
    showToast('Cliente excluído com sucesso!', 'success')
    showConfirmModal.value = false
    idParaExcluir.value = null
  }
}

function alertConfirmacaoSucesso() {
  if(editarCliente.value) {
    showToast('Cliente atualizado com sucesso!', 'success')
  } else {
    showToast('Cliente cadastrado com sucesso!', 'success')
  }
}

onMounted(carregar)
</script>
