<template>
  <div>
    <div class="d-flex justify-content-between">
      <h3>Lista de Lojas</h3>
      <button class="btn btn-primary mb-3" @click="novo">Novo +</button>
    </div>
    <BFormInput
      id="filter-input"
      v-model="filter"
      type="search"
      placeholder="Pesquisar lojas..."
    />
    <BTable
      ref="complete-table"
      :sort-internal="true"
      :items="lojas"
      :fields="fields"
      :current-page="paginaAtual"
      :per-page="perPage"
      :filter="filter"
      :responsive="false"
      :small="true"
      :multisort="true"
      class="table table-bordered"
    >
    <template #cell(funcionario_id)="{ item }">
      {{ item.funcionario_nome }}
    </template>
    <template #cell(cliente_id)="{ item }">
      {{ item.cliente_nome }}
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
      Tem certeza que deseja excluir esta loja?
    </BModal>
    <ToastAlert :message="toastMsg" :type="toastType" />
    <ModalLoja
      v-model="showModal"
      :edicao-loja="editarLoja"
      :lista-cliente="clientes"
      :lista-funcionario="funcionarios"
      @success="carregarESucesso"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, useTemplateRef, watch } from "vue";
import { authFetch, getCurrentUser } from "@/api/authFetch";
import {
  BButton,
  BModal,
  BDropdown,
  BDropdownItem,
  BPagination,
  BTable,
  BFormSelect,
  BTableProviderContext,
  BTableSortBy,
  ColorVariant,
  TableFieldRaw,
  TableItem,
  BFormInput,
} from "bootstrap-vue-next";
import ToastAlert from "@/components/ToastAlert.vue";
import { useToastAlert } from "@/composables/useToastAlert";
import ModalLoja from "./ModalLoja.vue";

interface Loja {
  id?: number;
  nome: string;
  funcionario_id: number;
  cliente_id: number;
  anuncios_total: number;
  anuncios_realizados: number;
  anuncios_otimizados: number;
  visitas_semana: number;
  produto_mais_visitado: string;
  vendas_total: number;
  funcionario_nome?: string;
  cliente_nome?: string;
}

interface Funcionario {
  id: number;
  nome: string;
}

interface Cliente {
  id: number;
  nome: string;
}

const lojas = ref<Loja[]>([]);
const funcionarios = ref<Funcionario[]>([]);
const clientes = ref<Cliente[]>([]);
const form = ref<Loja>({
  nome: "",
  funcionario_id: 0,
  cliente_id: 0,
  anuncios_total: 0,
  anuncios_realizados: 0,
  anuncios_otimizados: 0,
  visitas_semana: 0,
  produto_mais_visitado: "",
  vendas_total: 0,
});
const mostrarForm = ref(false);
const showConfirmModal = ref(false);
const idParaExcluir = ref<number | null>(null);
const showModal = ref(false);
const editarLoja = ref<Loja | null>(null);
const { toastMsg, toastType, showToast } = useToastAlert();
const perPage = ref(5);
const paginaAtual = ref(1);
const pageOptions = [
  { value: 5, text: "5" },
  { value: 10, text: "10" },
  { value: 15, text: "15" },
  { value: lojas.value.length, text: "Todos" },
];
const fields: TableFieldRaw<Loja>[] = [
  {
    key: "nome",
    label: "Nome",
  },
  {
    key: "funcionario_id",
    label: "Funcionário",
  },
  {
    key: "cliente_id",
    label: "Cliente",
  },
  {
    key: "anuncios_total",
    label: "Anúncios Total",
  },
  {
    key: "anuncios_realizados",
    label: "Anúncios Realizados",
  },
  {
    key: "anuncios_otimizados",
    label: "Anúncios Otimizados",
  },
  {
    key: "visitas_semana",
    label: "Visitas Semanal",
  },
  {
    key: "produto_mais_visitado",
    label: "Produto mais visitado",
  },
  {
    key: "vendas_total",
    label: "Vendas totais",
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
    return lojas.value;
  }
  return lojas.value.filter(
    (item) =>
      item.nome.toLowerCase().includes(lcFilter.value) ||
      item.funcionario_nome?.toLowerCase().includes(lcFilter.value) ||
      item.cliente_nome?.toLowerCase().includes(lcFilter.value) ||
      item.anuncios_total?.toString().includes(lcFilter.value) ||
      item.anuncios_realizados?.toString().includes(lcFilter.value) ||
      item.anuncios_otimizados?.toString().includes(lcFilter.value) ||
      item.visitas_semana?.toString().includes(lcFilter.value) ||
      item.produto_mais_visitado?.toLowerCase().includes(lcFilter.value) ||
      item.vendas_total?.toString().includes(lcFilter.value)
  );
});
const rows =  computed(() => filteredItems.value.length)

const table = ref()

const provider = (context: Readonly<BTableProviderContext<Loja>>) =>
  sortItems(filteredItems.value, context.sortBy).slice(
    (context.currentPage - 1) * context.perPage,
    context.currentPage * context.perPage
  )

const sortItems = (items: Loja[], sortBy?: BTableSortBy[]) => {
  if (!sortBy || sortBy.length === 0) {
    return items
  }

  return filteredItems.value.slice().sort((a: Loja, b: Loja) => {
    for (const sort of sortBy) {
      if (sort.order === undefined) {
        continue
      }
      const order = sort.order === 'asc' ? 1 : -1
      const key = sort.key as keyof Loja
      const aValue = a[key] as string | number
      const bValue = b[key] as string | number
      if (aValue < bValue) {
        return -1 * order
      } else if (aValue > bValue) {
        return 1 * order
      }
    }
    return 0
  })
}

watch(filter, () => {
  table.value?.refresh()
})
async function carregar() {
  const user = getCurrentUser();
  let lojasUrl = `https://gerenciamento-lojas-calculadora-precos.onrender.com/lojas`;
  if (user && user.id && user.id !== 0) {
    lojasUrl += `?funcionario_id=${user.id}`;
  }
  const [lojasResp, funcsResp, clientesResp] = await Promise.all([
    authFetch(lojasUrl),
    authFetch(
      `https://gerenciamento-lojas-calculadora-precos.onrender.com/funcionarios`
    ),
    authFetch(
      `https://gerenciamento-lojas-calculadora-precos.onrender.com/clientes`
    ),
  ]);
  let lojasData = await lojasResp.json();
  // Se não for admin, filtra no frontend também
  if (user && user.id && user.id !== 0) {
    lojasData = lojasData.filter((l: Loja) => l.funcionario_id === user.id);
  }
  lojas.value = lojasData;

  lojas.value.sort((a, b) =>
    (a.cliente_nome ?? "").localeCompare(b.cliente_nome ?? "")
  );
  funcionarios.value = await funcsResp.json();
  clientes.value = await clientesResp.json();
  funcionarios.value.sort((a, b) => a.nome.localeCompare(b.nome));
  clientes.value.sort((a, b) => a.nome.localeCompare(b.nome));
}

async function confirmarExclusao() {
  if (idParaExcluir.value !== null) {
    await authFetch(
      `https://gerenciamento-lojas-calculadora-precos.onrender.com/lojas/${idParaExcluir.value}`,
      { method: "DELETE" }
    );
    await carregar();
    showToast("Loja excluída com sucesso!", "success");
    showConfirmModal.value = false;
    idParaExcluir.value = null;
  }
}

async function salvar() {
  const user = getCurrentUser();
  if (user && user.id && user.id !== 0) {
    form.value.funcionario_id = user.id;
  }
  let url = `https://gerenciamento-lojas-calculadora-precos.onrender.com/lojas`;
  let method = "POST";
  if (form.value.id) {
    url = `https://gerenciamento-lojas-calculadora-precos.onrender.com/lojas/${form.value.id}`;
    method = "PUT";
  }
  await authFetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form.value),
  });
  cancelar();
  await carregar();
  showToast(
    form.value.id ? "Loja atualizada com sucesso!" : "Loja criada com sucesso!",
    "success"
  );
}

function novo() {
  showModal.value = true;
  editarLoja.value = null;
}

function editar(l: Loja) {
  editarLoja.value = { ...l };
  showModal.value = true;
}

function cancelar() {
  mostrarForm.value = false;
  limpar();
}

async function excluir(id: number) {
  idParaExcluir.value = id;
  showConfirmModal.value = true;
}

function limpar() {
  form.value = {
    nome: "",
    funcionario_id: 0,
    cliente_id: 0,
    anuncios_total: 0,
    anuncios_realizados: 0,
    anuncios_otimizados: 0,
    visitas_semana: 0,
    produto_mais_visitado: "",
    vendas_total: 0,
  };
}

function alertConfirmacaoSucesso() {
  if (editarLoja.value) {
    showToast("Loja atualizada com sucesso!", "success");
  } else {
    showToast("Loja cadastrada com sucesso!", "success");
  }
}

function carregarESucesso() {
  carregar();
  alertConfirmacaoSucesso();
}

onMounted(carregar);
</script>
