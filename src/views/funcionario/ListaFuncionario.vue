<template>
  <div>
    <div class="d-flex justify-content-between">
      <h3>Lista de Funcionários</h3>
      <button class="btn btn-primary mb-3" @click="novo">Novo +</button>
    </div>
    <BFormInput
      id="filter-input"
      v-model="filter"
      type="search"
      placeholder="Pesquisar funcionarios..."
    />
     <BTable
      ref="complete-table"
      :sort-internal="true"
      :items="funcionarios"
      :fields="fields"
      :current-page="paginaAtual"
      :per-page="perPage"
      :filter="filter"
      :responsive="false"
      :small="true"
      :multisort="true"
      class="table table-bordered"
    >
      <template #cell(cargo_superior)="{ item}"> 
        {{ item.cargo_superior ? 'Sim' : 'Não' }}
      </template>
      <template #cell(isAtivo)="{ item}"> 
        {{ item.isAtivo ? 'Sim' : 'Não' }}
      </template>
      <template #cell(data_receber_pagamento)="{ item }">
        <BFormInput
          v-model="item.data_receber_pagamento"
          type="date"
          class="form-control"
          @input="atualizarPagamento(item)"
        />
      </template>
      <template #cell(valor_receber)="{ item }">
        <BInputGroup prepend="R$">
          <BFormInput
            v-model="item.valor_receber"
            type="number"
            class="form-control"
            @input="atualizarPagamento(item)"
          />
        </BInputGroup>
      </template>
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
      Tem certeza que deseja excluir este funcionário?
    </BModal>
    <ToastAlert :message="toastMsg" :type="toastType" />
    <ModalFuncionario
      v-model="showModal"
      :edicao-funcionario="editarFuncionario"
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
import ModalFuncionario from "./ModalFuncionario.vue";

interface Funcionario {
  id?: number;
  nome: string;
  telefone: string;
  email?: string;
  senha?: string;
  cargo_superior?: boolean;
  valor_receber?: number;
  data_receber_pagamento?: string;
  chave_pix?: string;
  calculadora_liberada?: boolean;
  relatorio_liberado?: boolean;
  administrador_geral?: boolean;
  isAtivo?: boolean;
  permissoes?: string;
}

const funcionarios = ref<Funcionario[]>([]);

const showConfirmModal = ref(false);
const idParaExcluir = ref<number | null>(null);
const showModal = ref(false);
const editarFuncionario = ref<Funcionario | null>(null);
const { toastMsg, toastType, showToast } = useToastAlert();

// Filtragens e paginações

const perPage = ref(5);
const paginaAtual = ref(1);
const pageOptions = [
  { value: 5, text: "5" },
  { value: 10, text: "10" },
  { value: 15, text: "15" },
  { value: funcionarios.value.length, text: "Todos" },
];
const fields: TableFieldRaw<Funcionario>[] = [
  {
    key: "nome",
    label: "Nome",
  },
  {
    key: "telefone",
    label: "Telefone",
  },
  {
    key: "email",
    label: "E-mail",
  },
  {
    key: "isAtivo",
    label: "Ativo",
  },
  {
    key: "permissoes",
    label: "Permissões",
  },
  {
    key: "administrador_geral",
    label: "ADM",
  },
  {
    key: "cargo_superior",
    label: "Cargo superior",
  },
  {
    key: "valor_receber",
    label: "Valor a receber",
  },
  {
    key: "data_receber_pagamento",
    label: "Data a receber pagamento",
  },
  {
    key: "chave_pix",
    label: "Chave PIX",
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
    return funcionarios.value;
  }
  return funcionarios.value.filter(
    (item) =>
      item.nome.toLowerCase().includes(lcFilter.value) ||
      item.telefone.toLowerCase().includes(lcFilter.value) ||
      item.email?.toLowerCase().includes(lcFilter.value) ||
      item.cargo_superior?.toString().includes(lcFilter.value) ||
      item.valor_receber?.toString().includes(lcFilter.value) ||
      item.data_receber_pagamento?.toLowerCase().includes(lcFilter.value) ||
      item.chave_pix?.toLowerCase().includes(lcFilter.value)
  );
});
const rows =  computed(() => filteredItems.value.length)

const table = ref()


watch(filter, () => {
  table.value?.refresh()
})

//////////////////////////


async function carregar() {
  const resp = await authFetch(
    `https://gerenciamento-lojas-calculadora-precos.onrender.com/funcionarios`
  );
  const rows = await resp.json();
  funcionarios.value = rows.map((r: Funcionario) => ({
    ...r,
    cargo_superior: !!r.cargo_superior,
  }));
  funcionarios.value.sort((a, b) => a.nome.localeCompare(b.nome));
}

function novo() {
  showModal.value = true;
  editarFuncionario.value = null;
}

function editar(f: Funcionario) {
  editarFuncionario.value = { ...f };
  showModal.value = true;
}

async function excluir(id: number) {
  idParaExcluir.value = id;
  showConfirmModal.value = true;
}

async function confirmarExclusao() {
  if (idParaExcluir.value !== null) {
    await authFetch(
      `https://gerenciamento-lojas-calculadora-precos.onrender.com/funcionarios/${idParaExcluir.value}`,
      {
        method: "DELETE",
      }
    );
    await carregar();
    showToast("Funcionário excluído com sucesso!", "success");
    showConfirmModal.value = false;
    idParaExcluir.value = null;
  }
}

async function atualizarPagamento(e: Funcionario) {
  const atualizado = { ...e };
  const payload = {
    ...atualizado,
    valor_receber: atualizado.valor_receber,
    data_receber_pagamento: atualizado.data_receber_pagamento,
  };
  let url = `https://gerenciamento-lojas-calculadora-precos.onrender.com/funcionarios/${atualizado.id}`;
  let method = "PUT";
  await authFetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function alertConfirmacaoSucesso() {
  if (editarFuncionario.value) {
    showToast("Funcionário atualizado com sucesso!", "success");
  } else {
    showToast("Funcionário cadastrado com sucesso!", "success");
  }
}

function carregarESucesso() {
  carregar();
  alertConfirmacaoSucesso();
}

onMounted(carregar);
</script>
