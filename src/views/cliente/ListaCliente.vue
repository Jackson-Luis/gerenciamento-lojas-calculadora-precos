<template>
  <div>
    <div class="d-flex justify-content-between">
      <h3>Lista de Clientes</h3>
      <button class="btn btn-primary mb-3" @click="novo">Novo +</button>
    </div>
    <BFormInput
      id="filter-input"
      v-model="filter"
      type="search"
      placeholder="Pesquisar clientes..."
    />
    <BTable
      ref="complete-table"
      :sort-internal="true"
      :items="clientes"
      :fields="fields"
      :current-page="paginaAtual"
      :per-page="perPage"
      :filter="filter"
      :responsive="false"
      :small="true"
      :multisort="true"
      class="table table-bordered"
    >
      <template #cell(actions)="{ item }">
        <BDropdown
          size="sm"
          variant="link"
          toggle-class="text-decoration-none"
          no-caret
        >
          <template #button-content
            >&#x2630;<span class="visually-hidden">Ações</span>
          </template>
          <BDropdownItem @click="editar(item)">Editar</BDropdownItem>
          <BDropdownItem @click="excluir(item.id)">Excluir</BDropdownItem>
        </BDropdown>
      </template>
    </BTable>
    <div class="d-flex justify-content-between">
      <BPagination
        v-model="paginaAtual"
        :total-rows="rows"
        :per-page="perPage"
        :align="'fill'"
        class="my-0"
      />

      <BFormSelect
        id="per-page-select"
        v-model="perPage"
        :options="pageOptions"
        class="w-auto"
      />
    </div>
    <BModal
      v-model="showConfirmModal"
      title="Confirmar exclusão"
      ok-title="Excluir"
      cancel-title="Cancelar"
      @ok="confirmarExclusao"
    >
      Tem certeza que deseja excluir este cliente?
    </BModal>
    <ToastAlert :message="toastMsg" :type="toastType" />
    <ModalCliente
      v-model="showModal"
      :edicao-cliente="editarCliente"
      @success="carregarESucesso"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { authFetch } from "@/api/authFetch";
import {
  BModal,
  BDropdown,
  BDropdownItem,
  BPagination,
  BTable,
  BFormSelect,
  TableFieldRaw,
  BFormInput,
} from "bootstrap-vue-next";
import ToastAlert from "@/components/ToastAlert.vue";
import { useToastAlert } from "@/composables/useToastAlert";
import ModalCliente from "./ModalCliente.vue";

interface Cliente {
  id?: number;
  nome: string;
  telefone: string;
}

const clientes = ref<Cliente[]>([]);
const showConfirmModal = ref(false);
const idParaExcluir = ref<number | null>(null);
const showModal = ref(false);
const editarCliente = ref<Cliente | null>(null);
const { toastMsg, toastType, showToast } = useToastAlert();

// Filtragens e paginações

const perPage = ref(5);
const paginaAtual = ref(1);
const pageOptions = [
  { value: 5, text: "5" },
  { value: 10, text: "10" },
  { value: 15, text: "15" },
  { value: clientes.value.length, text: "Todos" },
];
const fields: TableFieldRaw<Cliente>[] = [
  {
    key: "nome",
    label: "Nome",
  },
  {
    key: "telefone",
    label: "Telefone",
  },
  {
    key: "actions",
    label: "Ações",
    sortable: false,
  },
];

const filter = ref("");

const lcFilter = computed(() => filter.value.toLocaleLowerCase());

const filteredItems = computed(() => {
  if (!filter.value) {
    return clientes.value;
  }
  return clientes.value.filter(
    (item) =>
      item.nome.toLowerCase().includes(lcFilter.value) ||
      item.telefone.toLowerCase().includes(lcFilter.value)
  );
});
const rows = computed(() => filteredItems.value.length);

const table = ref();

watch(filter, () => {
  table.value?.refresh();
});

//////////////////////////

async function carregar() {
  const resp = await authFetch(
    `https://gerenciamento-lojas-calculadora-precos.onrender.com/clientes`
  );
  clientes.value = await resp.json();
  clientes.value.sort((a, b) => (a.nome ?? "").localeCompare(b.nome ?? ""));
}

function novo() {
  showModal.value = true;
  editarCliente.value = null;
}

function editar(c: Cliente) {
  editarCliente.value = { ...c };
  showModal.value = true;
}

async function excluir(id: number) {
  idParaExcluir.value = id;
  showConfirmModal.value = true;
}

async function confirmarExclusao() {
  if (idParaExcluir.value !== null) {
    await authFetch(
      `https://gerenciamento-lojas-calculadora-precos.onrender.com/clientes/${idParaExcluir.value}`,
      { method: "DELETE" }
    );
    await carregar();
    showToast("Cliente excluído com sucesso!", "success");
    showConfirmModal.value = false;
    idParaExcluir.value = null;
  }
}

function alertConfirmacaoSucesso() {
  if (editarCliente.value) {
    showToast("Cliente atualizado com sucesso!", "success");
  } else {
    showToast("Cliente cadastrado com sucesso!", "success");
  }
}
function carregarESucesso() {
  carregar();
  alertConfirmacaoSucesso();
}
onMounted(carregar);
</script>
