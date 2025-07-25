<script setup lang="ts">
import { Button, Hr, Html, Text } from '@vue-email/components'
import { ref, onMounted, defineProps } from "vue";

defineProps({
  title: String,
})
</script>

<template>
  <Html lang="en">
    <Text>{{ title }}</Text>
    <Hr />
    <Button href="https://example.com">Click me</Button>
  </Html>
</template>
