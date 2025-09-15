<template>
    <BModal v-model="showModal" :title="form.id ? 'Atualizar cliente' : 'Cadastrar novo Cliente'" @ok="cadastrarOuEditar" style="color: Black"
        :ok-disabled="isLoading" no-footer>
        <form @submit.prevent="cadastrarOuEditar">
            <div class="mb-2">
                <label>Nome:</label>
                <input v-model="form.nome" class="form-control" required />
            </div>
            <div class="mb-2">
                <label>Telefone:</label>
                <input v-model="form.telefone" required class="form-control" @input="maskTelefone" maxlength="15" />
            </div>
            <div class="mb-2">
                <BFormCheckbox switch v-model="form.isAtivo">Ativo</BFormCheckbox>
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
import { reactive, ref, watch, defineProps, defineEmits } from 'vue'
import { BModal, BButton, BFormCheckbox } from 'bootstrap-vue-next'
import { authFetch } from '@/api/authFetch'

interface Cliente {
  id?: number | null
  nome: string
  telefone: string
  isAtivo: boolean
}

const props = defineProps<{
    modelValue: boolean
    edicaoCliente?: Cliente | null
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
    telefone: '',
    isAtivo: true,
})

watch(() => props.modelValue, (newVal) => {
    showModal.value = newVal
})
watch(() => showModal.value, (newVal) => {
    emit('update:modelValue', newVal)
    
    if(props.edicaoCliente && props.edicaoCliente.id) {
        form.id = props.edicaoCliente.id
        form.nome = props.edicaoCliente.nome
        form.telefone = props.edicaoCliente.telefone
        form.isAtivo = props.edicaoCliente.isAtivo ?? true
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
    form.telefone = ''
    form.isAtivo = true
}
function maskTelefone(event: Event) {
    const input = event.target as HTMLInputElement
    input.value = input.value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2')
}
async function cadastrarOuEditar() {
    isLoading.value = true
    try {
        let url = `https://gerenciamento-lojas-calculadora-precos.onrender.com/clientes`;
        let method = 'POST';
        if (form.id) {
            url = `https://gerenciamento-lojas-calculadora-precos.onrender.com/clientes/${form.id}`;
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
            error.value = 'Erro ao atualizar cliente.'
        } else {
            error.value = 'Erro ao criar cliente.'
        }
    } finally {
        isLoading.value = false
    }
}
</script>
