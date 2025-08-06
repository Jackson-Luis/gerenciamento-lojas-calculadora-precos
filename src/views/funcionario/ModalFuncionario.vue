<template>
    <BModal v-model="showModal" title="Alterar senha" ok-title="Salvar" cancel-title="Cancelar" @ok="cadastrarOuEditar"
        :ok-disabled="isLoading">
        <div>
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
                <BFormCheckbox switch v-model="form.cargo_superior">Cargo Superior</BFormCheckbox>
            </div>
            <button class="btn btn-success" type="submit">
                {{ form.id ? "Atualizar" : "Adicionar" }}
            </button>
        </div>
    </BModal>
</template>
<script setup lang="ts">
import { reactive, ref, watch, defineProps, defineEmits } from 'vue'
import { BModal } from 'bootstrap-vue-next'
import { authFetch } from '@/api/authFetch'

const props = defineProps<{
    modelValue: boolean
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
})
watch(() => props.modelValue, (newVal) => {
    showModal.value = newVal
})
watch(() => showModal.value, (newVal) => {
    emit('update:modelValue', newVal)
    if (!newVal) reset()
})
function reset() {
    form.id = undefined
    form.nome = ''
    form.email = ''
    form.senha = ''
    form.chave_pix = ''
    form.telefone = ''
    form.cargo_superior = false
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

</script>