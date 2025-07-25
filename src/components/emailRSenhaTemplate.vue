<script setup lang="ts">
import { Html, Body, Container, Text, Button } from '@vue-email/components'
import { defineProps } from 'vue'

const props = defineProps<{ title: string }>()
</script>

<template>
  <Html>
    <Body>
      <Container>
        <Text>{{ props.title }}</Text>
        <Button href="https://example.com">Clique aqui</Button>
      </Container>
    </Body>
  </Html>
</template>
