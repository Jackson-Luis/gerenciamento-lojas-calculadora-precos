<template>
    <BModal v-model="showModal" :title="form.id ? 'Atualizar Loja' : 'Cadastrar nova Loja'" ok-title="Salvar" cancel-title="Cancelar" @ok="cadastrarOuEditar"
        :ok-disabled="isLoading" no-footer>
        <form @submit.prevent="cadastrarOuEditar">
            <div class="mb-2">
                <label>Nome da Loja:</label>
                <input v-model="form.nome" class="form-control" required />
            </div>
            <div class="mb-2">
                <label>Funcionário:</label>
                <select v-model="form.funcionario_id" class="form-control" :disabled="isAdmin" required>
                <option value="" disabled>Selecione</option>
                <option v-for="f in listaFuncionario" :key="f.id" :value="f.id">{{ f.nome }}</option>
                </select>
            </div>
            <div class="mb-2">
                <label>Cliente:</label>
                <select v-model="form.cliente_id" class="form-control" autocomplete required>
                <option value="" disabled>Selecione</option>
                <option v-for="c in listaCliente" :key="c.id" :value="c.id">{{ c.nome }}</option>
                </select>
            </div>
            <div class="mb-2 d-flex justify-content-end">
                <BButton class="btn btn-success" type="submit">{{ form.id ? 'Atualizar' : 'Adicionar' }}</BButton>
                <BButton class="btn btn-secondary ms-2" type="button" @click="cancelar">Cancelar</BButton>
            </div>
        </form>
    </BModal>
</template>

<script setup lang="ts">
import { reactive, ref, watch, defineProps, defineEmits, computed } from "vue";
import { BButton, BModal, BFormCheckbox } from "bootstrap-vue-next";
import { getCurrentUser } from "@/api/authFetch";
import { authFetch } from "@/api/authFetch";

interface Loja {
  id?: number
  nome: string
  funcionario_id: number
  cliente_id: number
  funcionario_nome?: string
  cliente_nome?: string
  anuncios_total: number;
  anuncios_realizados: number;
  anuncios_otimizados: number;
  visitas_semana: number;
  produto_mais_visitado: string;
  vendas_total: number;
}

const props = defineProps<{
  modelValue: boolean;
  edicaoLoja?: Loja | null;
  listaCliente: Array<{ id: number; nome: string }>;
  listaFuncionario: Array<{ id: number; nome: string }>;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "success"): void;
}>();

const currentUser = computed(() => getCurrentUser());
const isAdmin = computed(() => !!currentUser.value?.cargo_superior);
const funcionarioNaoAdmin = computed(() => !isAdmin.value ? null : currentUser.value?.id || null); 

const showModal = ref(props.modelValue);
const isLoading = ref(false);
const error = ref("");
const form = reactive({
  id: undefined as number | undefined,
  nome: "",
  funcionario_id: funcionarioNaoAdmin.value,
  cliente_id: null as number | null,
// Desabilitados
  anuncios_total: 0,
  anuncios_realizados: 0,
  anuncios_otimizados: 0,
  visitas_semana: 0,
  produto_mais_visitado: "",
  vendas_total: 0,
});



watch(
  () => props.modelValue,
  (newVal) => {
    showModal.value = newVal;
  }
);

watch(
  () => showModal.value,
  (newVal) => {
    emit("update:modelValue", newVal);
    if (props.edicaoLoja && props.edicaoLoja.id) {
      form.id = props.edicaoLoja.id;
      form.nome = props.edicaoLoja.nome;
      form.funcionario_id = props.edicaoLoja.funcionario_id;
      form.cliente_id = props.edicaoLoja.cliente_id;
      form.anuncios_total = props.edicaoLoja.anuncios_total;
      form.anuncios_realizados = props.edicaoLoja.anuncios_realizados;
      form.anuncios_otimizados = props.edicaoLoja.anuncios_otimizados;
      form.visitas_semana = props.edicaoLoja.visitas_semana;
      form.produto_mais_visitado = props.edicaoLoja.produto_mais_visitado;
      form.vendas_total = props.edicaoLoja.vendas_total;
    } else {
      reset();
    }
  }
);

function cancelar() {
  showModal.value = false;
  reset();
}

function reset() {
  form.id = undefined;
  form.nome = "";
  form.funcionario_id = funcionarioNaoAdmin.value;
  form.cliente_id = null;
  error.value = "";
}

function maskTelefone(event: Event) {
  const input = event.target as HTMLInputElement;
  input.value = input.value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d)(\d{4})$/, "$1-$2");
}

async function cadastrarOuEditar() {
  isLoading.value = true;
  try {
    let url = `https://gerenciamento-lojas-calculadora-precos.onrender.com/lojas`;
    let method = "POST";
    if (form.id) {
      url = `https://gerenciamento-lojas-calculadora-precos.onrender.com/lojas/${form.id}`;
      method = "PUT";
    }
    await authFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    showModal.value = false;
    emit("success");
    reset();
  } catch (err) {
    if (form.id) {
      error.value = "Erro ao atualizar loja.";
    } else {
      error.value = "Erro ao criar loja.";
    }
  } finally {
    isLoading.value = false;
  }
}
</script>
