<template>
  <!-- v-model controla abertura/fechamento -->
  <BModal
    v-model="showModal"
    title="Alterar senha"
    ok-title="Salvar"
    cancel-title="Cancelar"
    @ok="handleSubmit"
    :ok-disabled="isLoading"
  >
    <div v-if="error" class="alert alert-danger py-1 text-center" role="alert">
      {{ error }}
    </div>
    OBS: *Função Incompleta*
    <form @submit.prevent="handleSubmit">
      <div class="mb-3">
        <label class="form-label">Nova senha</label>
        <input
          v-model="form.novaSenha"
          type="password"
          class="form-control"
          autocomplete="new-password"
          required
        />
      </div>

      <div class="mb-3">
        <label class="form-label">Repetir nova senha</label>
        <input
          v-model="form.repeteSenha"
          type="password"
          class="form-control"
          autocomplete="new-password"
          required
        />
      </div>
    </form>
  </BModal>
</template>

<script setup lang="ts">
/* -------------------------------------------------------------------------- */
/* Imports                                                                    */
/* -------------------------------------------------------------------------- */
import { reactive, ref, watch, defineProps, defineEmits } from 'vue'
import { BModal } from 'bootstrap-vue-next'
import { authFetch } from '@/api/authFetch'
import { API_URL } from '../api'

/* -------------------------------------------------------------------------- */
/* Props / Emits                                                              */
/* -------------------------------------------------------------------------- */
const props = defineProps<{
  /** v-model */
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success'): void
}>()

/* -------------------------------------------------------------------------- */
/* State                                                                      */
/* -------------------------------------------------------------------------- */
const showModal = ref(props.modelValue)
const isLoading = ref(false)
const error = ref('')
const form = reactive({
  novaSenha: '',
  repeteSenha: '',
})

/* -------------------------------------------------------------------------- */
/* Reatividade v-model                                                        */
/* -------------------------------------------------------------------------- */
watch(
  () => props.modelValue,
  (v) => (showModal.value = v)
)
watch(
  () => showModal.value,
  (v) => emit('update:modelValue', v)
)

/* -------------------------------------------------------------------------- */
/* Métodos                                                                     */
/* -------------------------------------------------------------------------- */
function reset() {
  form.novaSenha = ''
  form.repeteSenha = ''
  error.value = ''
}

async function handleSubmit() {
  error.value = ''

  if (form.novaSenha !== form.repeteSenha) {
    error.value = 'As senhas não coincidem'
    return false
  }
  if (form.novaSenha.length < 6) {
    error.value = 'A senha deve ter pelo menos 6 caracteres'
    return false
  }

  try {
    isLoading.value = true
    await authFetch(`https://gerenciamento-lojas-calculadora-precos.onrender.com/alterar-senha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ novaSenha: form.novaSenha }),
    })
    emit('success')
    // showModal.value = false
  } catch {
    error.value = 'Erro ao alterar a senha'
    return false
  } finally {
    isLoading.value = false
  }
}

/* limpa sempre que o modal abre */
watch(showModal, (open) => open && reset())
</script>
