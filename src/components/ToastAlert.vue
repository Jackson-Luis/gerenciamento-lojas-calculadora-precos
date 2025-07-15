<template>
  <div
    v-if="show"
    :class="['alert', type === 'success' ? 'alert-success' : type === 'danger' ? 'alert-danger' : 'alert-info', 'position-fixed', 'top-0', 'end-0', 'm-3', 'fade', 'show']"
    style="z-index:9999; min-width:200px;"
  >
    {{ message }}
  </div>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineExpose } from 'vue'

const props = defineProps<{
  message: string
  type?: 'success' | 'danger' | 'info'
  duration?: number
}>()

const show = ref(false)
const message = ref(props.message)
const type = ref(props.type || 'info')
const duration = ref(props.duration || 2500)

watch(() => props.message, (val) => {
  message.value = val
  if (val) {
    show.value = true
    setTimeout(() => {
      show.value = false
    }, duration.value)
  }
})

watch(() => props.type, (val) => {
  type.value = val || 'info'
})

defineExpose({ show })
</script>
