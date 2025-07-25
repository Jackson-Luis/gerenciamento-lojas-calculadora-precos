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
        <label>Email:</label>
        <input
          v-model="form.email"
          class="form-control"
          type="email"
          required
        />
      </div>
      <div class="mb-2">
        <label>Senha:</label>
        <input
          v-model="form.senha"
          class="form-control"
          type="password"
          :required="!form.id"
          autocomplete="new-password"
        />
      </div>
      <div class="mb-2">
        <label>Chave Pix:</label>
        <input
          v-model="form.chave_pix"
          class="form-control"
        />
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
      <div class="mb-2">
        <BFormCheckbox switch v-model="form.cargo_superior">Cargo Superior</BFormCheckbox>
      </div>
      <button class="btn btn-success" type="submit">
        {{ form.id ? "Atualizar" : "Adicionar" }}
      </button>
      <button class="btn btn-secondary ms-2" type="button" @click="cancelar">
        Cancelar
      </button>
    </form>
    <hr />
    <h3>Funcionários</h3>
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Email</th>
          <th>Telefone</th>
          <th>Data de Pagamento</th>
          <th>Valor a Receber</th>
          <th>Chave PIX</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="f in funcionarios" :key="f.id">
          <td>{{ f.nome }}</td>
          <td>{{ f.email }}</td>
          <td>{{ f.telefone }}</td>
          <td>
            <BFormInput
              v-model="f.data_receber_pagamento"
              type="date"
              class="form-control"
              @input="atualizarPagamento(f)"
            />
          </td>
          <td>
            <BInputGroup prepend="R$">
              <BFormInput
                v-model="f.valor_receber"
                type="number"
                class="form-control"
                @input="atualizarPagamento(f)"
              />
            </BInputGroup>
          </td>
          <td>{{ f.chave_pix }}</td>
          <td>
            <BDropdown
              size="lg"
              variant="link"
              toggle-class="text-decoration-none"
              no-caret
            >
            <template #button-content>&#x2630;<span class="visually-hidden">Ações</span> </template>
                <BDropdownItem @click="editar(f)">Editar</BDropdownItem>
                <BDropdownItem @click="excluir(f.id)">Excluir</BDropdownItem>
            </BDropdown>
          </td>
        </tr>
      </tbody>
    </table>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { authFetch } from "../api/authFetch";
import {
  BModal,
  BFormCheckbox,
  BInputGroup,
  BFormInput,
  BDropdown,
  BDropdownItem,
} from "bootstrap-vue-next";
import ToastAlert from "../components/ToastAlert.vue";
import { useToastAlert } from "../composables/useToastAlert";

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
}

const funcionarios = ref<Funcionario[]>([]);
const form = ref<Funcionario>({
  nome: "",
  telefone: "",
  email: "",
  senha: "",
  cargo_superior: false,
  valor_receber: 0,
  data_receber_pagamento: "",
  chave_pix: "",
});
const mostrarForm = ref(false);
const showConfirmModal = ref(false);
const idParaExcluir = ref<number | null>(null);

const { toastMsg, toastType, showToast } = useToastAlert();

async function carregar() {
  const resp = await authFetch(`https://gerenciamento-lojas-calculadora-precos.onrender.com/funcionarios`);
  const rows = await resp.json();
  funcionarios.value = rows.map((r: any) => ({
    ...r,
    cargo_superior: !!r.cargo_superior,
  }));
}

async function salvar() {
  const payload = {
    ...form.value,
    cargo_superior: form.value.cargo_superior ? 1 : 0,
  };
  const isAtualizar = !!form.value.id;
  let url = `https://gerenciamento-lojas-calculadora-precos.onrender.com/funcionarios`;
  let method = "POST";
  if (isAtualizar) {
    url = `https://gerenciamento-lojas-calculadora-precos.onrender.com/funcionarios/${form.value.id}`;
    method = "PUT";
  }

  try {
    const resp = await authFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const error = await resp.json();
      showToast(error.error || 'Erro ao salvar funcionário', 'danger');
      return;
    }

    cancelar();
    await carregar();
    showToast(
      isAtualizar
        ? "Funcionário atualizado com sucesso!"
        : "Funcionário criado com sucesso!",
      "success"
    );
  } catch (err) {
    showToast("Erro de rede ao salvar funcionário", "danger");
  }
}


function novo() {
  limpar();
  mostrarForm.value = true;
}

function editar(f: Funcionario) {
  form.value = { ...f };
  mostrarForm.value = true;
}

function cancelar() {
  mostrarForm.value = false;
  limpar();
}

async function excluir(id: number) {
  idParaExcluir.value = id;
  showConfirmModal.value = true;
}

async function confirmarExclusao() {
  if (idParaExcluir.value !== null) {
    await authFetch(`https://gerenciamento-lojas-calculadora-precos.onrender.com/funcionarios/${idParaExcluir.value}`, {
      method: "DELETE",
    });
    await carregar();
    showToast("Funcionário excluído com sucesso!", "success");
    showConfirmModal.value = false;
    idParaExcluir.value = null;
  }
}

function limpar() {
  form.value = {
    nome: "",
    telefone: "",
    email: "",
    senha: "",
    cargo_superior: false,
  };
}

function maskTelefone(e: Event) {
  let v = (e.target as HTMLInputElement).value.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 6) {
    v = v.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
  } else if (v.length > 2) {
    v = v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
  } else {
    v = v.replace(/^(\d*)/, "($1");
  }
  (e.target as HTMLInputElement).value = v;
  form.value.telefone = v;
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

onMounted(carregar);
</script>
