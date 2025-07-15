import { ref } from 'vue'

export function useToastAlert() {
  const toastMsg = ref('')
  const toastType = ref<'success' | 'danger' | 'info'>('info')

  function showToast(msg: string, type: 'success' | 'danger' | 'info' = 'info') {
    toastMsg.value = msg
    toastType.value = type
    setTimeout(() => {
      toastMsg.value = ''
    }, 2500)
  }

  return { toastMsg, toastType, showToast }
}
