<template>
    <BModal v-model="showModal" :title="form.id ? 'Atualizar Funcionário' : 'Cadastrar novo Funcionário'"
        ok-title="Salvar" cancel-title="Cancelar" @ok="cadastrarOuEditar" :ok-disabled="isLoading" no-footer>
        <form @submit.prevent="cadastrarOuEditar">
            <div class="mb-2">
                <label>Nome:</label>
                <input v-model="form.nome" class="form-control" required />
            </div>
            <div class="mb-2">
                <label>Email:</label>
                <input v-model="form.email" class="form-control" type="email" required />
            </div>
            <div class="mb-2">
                <label>Senha:</label>
                <input v-model="form.senha" class="form-control" type="password" :required="!form.id"
                    autocomplete="new-password" />
            </div>
            <div class="mb-2">
                <label>Chave Pix:</label>
                <input v-model="form.chave_pix" class="form-control" />
            </div>
            <div class="mb-2">
                <label>Telefone:</label>
                <input v-model="form.telefone" class="form-control" @input="maskTelefone" maxlength="15" />
            </div>
            <div class="mb-2">
                <BFormCheckbox switch v-model="form.calculadora_liberada">Acesso à Calculadora</BFormCheckbox>
            </div>
            <div v-if="administrador_geral == true">
                <div class="mb-2">
                    <BFormCheckbox switch v-model="form.cargo_superior">Cargo Superior</BFormCheckbox>
                </div>
                <div class="mb-2">
                    <BFormCheckbox switch v-model="form.relatorio_liberado">Acesso aos relatórios</BFormCheckbox>
                </div>
                <div class="mb-2">
                    <BFormCheckbox switch v-model="form.administrador_geral">Administrador Geral</BFormCheckbox>
                </div>
                <div class="mb-2">
                    <BFormCheckbox switch v-model="form.is_ativo">Ativo</BFormCheckbox>
                </div>
            </div>

            <hr />
            <div class="mb-2 d-flex justify-content-end">
                <BButton class="btn btn-success" type="submit">{{ form.id ? 'Atualizar' : 'Adicionar' }}</BButton>
                <BButton class="btn btn-secondary ms-2" type="button" @click="cancelar">Cancelar</BButton>
            </div>
        </form>
    </BModal>
</template>
<script setup lang="ts">
import { reactive, ref, watch, defineProps, defineEmits, onMounted } from 'vue'
import { BButton, BModal, BFormCheckbox } from 'bootstrap-vue-next'
import { authFetch, getCurrentUser } from '@/api/authFetch'

interface Funcionario {
    id?: number | null
    nome: string
    telefone: string
    email: string
    senha: string
    cargo_superior: boolean
    chave_pix: string
    calculadora_liberada: boolean
    relatorio_liberado: boolean
    administrador_geral: boolean
    is_ativo: boolean
}

const props = defineProps<{
    modelValue: boolean
    edicaoFuncionario?: Funcionario | null
}>()
const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'success'): void
}>()
const showModal = ref(props.modelValue)
const isLoading = ref(false)
const error = ref('')
const form = reactive({
    id: undefined as number | undefined,
    nome: '',
    email: '',
    senha: '',
    chave_pix: '',
    telefone: '',
    cargo_superior: false,
    calculadora_liberada: false,
    relatorio_liberado: false,
    administrador_geral: false,
    is_ativo: true
})
watch(() => props.modelValue, (newVal) => {
    showModal.value = newVal
})
watch(() => showModal.value, (newVal) => {
    emit('update:modelValue', newVal)
    if (props.edicaoFuncionario && props.edicaoFuncionario.id) {
        form.id = props.edicaoFuncionario.id
        form.nome = props.edicaoFuncionario.nome
        form.telefone = props.edicaoFuncionario.telefone
        form.email = props.edicaoFuncionario.email
        form.senha = props.edicaoFuncionario.senha
        form.chave_pix = props.edicaoFuncionario.chave_pix
        form.cargo_superior = props.edicaoFuncionario.cargo_superior
        form.calculadora_liberada = props.edicaoFuncionario.calculadora_liberada
        form.relatorio_liberado = props.edicaoFuncionario.relatorio_liberado
        form.administrador_geral = props.edicaoFuncionario.administrador_geral
        form.is_ativo = props.edicaoFuncionario.is_ativo ?? true
    } else {
        reset()
    }
})

function cancelar() {
    showModal.value = false
    reset()
}

function reset() {
    form.id = undefined
    form.nome = ''
    form.email = ''
    form.senha = ''
    form.chave_pix = ''
    form.telefone = ''
    form.cargo_superior = false
    form.calculadora_liberada = false
    form.relatorio_liberado = false
    form.administrador_geral = false
    form.is_ativo = true
    error.value = ''
}

function maskTelefone(event: Event) {
    const input = event.target as HTMLInputElement
    input.value = input.value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2')
}

async function cadastrarOuEditar() {
    isLoading.value = true
    try {
        let url = `https://gerenciamento-lojas-calculadora-precos.onrender.com/funcionarios`;
        let method = 'POST';
        if (form.id) {
            url = `https://gerenciamento-lojas-calculadora-precos.onrender.com/funcionarios/${form.id}`;
            method = 'PUT';
        }
        await authFetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });

        showModal.value = false
        emit('success')
        reset()
    } catch (err) {
        if (form.id) {
            error.value = 'Erro ao atualizar funcionário.'
        } else {
            error.value = 'Erro ao criar funcionário.'
        }
    } finally {
        isLoading.value = false
    }
}

const administrador_geral = ref(false);
onMounted(() => {
    const user = getCurrentUser();
    if (user && user.administrador_geral) {
        administrador_geral.value = true;
    }
});

</script>
