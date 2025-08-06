<script setup lang="ts">
import { Button, Hr, Html, Text } from '@vue-email/components'
import { defineProps } from "vue";

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
