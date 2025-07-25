<template>
  <BModal
    v-model="internoVisivel"
    title="Recuperar Senha"
    centered
    @hide="fechar"
    no-footer
  >
    <div class="mb-3">
      <label for="email" class="form-label">E-mail</label>
      <input
        id="email"
        v-model="email"
        type="email"
        class="form-control"
        placeholder="exemplo@email.com"
        required
      />
    </div>

    <div class="d-flex justify-content-end gap-2 mt-3">
      <BButton variant="secondary" @click="fechar" :disabled="enviando">
        Cancelar
      </BButton>
      <BButton variant="primary" @click="enviar" :disabled="enviando">
        {{ enviando ? "Enviando..." : "Enviar" }}
      </BButton>
    </div>
  </BModal>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from "vue";
import { render } from "@vue-email/render";
import { BModal, BButton } from "bootstrap-vue-next";
import EmailRSenhaTemplate from "@/components/emailRSenhaTemplate.vue";

const props = defineProps<{ visivel: boolean }>();
const emit = defineEmits(["fechar"]);

const internoVisivel = ref(false);
const email = ref("");
const enviando = ref(false);

// Sincroniza a prop externa com o v-model interno do modal
watch(
  () => props.visivel,
  (v) => (internoVisivel.value = v)
);

const fechar = () => {
  internoVisivel.value = false;
  emit("fechar");
};

const enviar = async () => {
  if (!email.value.includes("@")) {
    alert("E-mail inválido");
    return;
  }

  enviando.value = true;

  try {
    const html = await render(EmailRSenhaTemplate, {
      title: "Recuperação de Senha",
    });

    const response = await fetch(`https://gerenciamento-lojas-calculadora-precos.onrender.com/enviar-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ para: email.value, html }),
    });

    if (!response.ok) throw new Error("Erro ao enviar e-mail");

    alert("E-mail enviado com sucesso!");
    fechar();
  } catch (e) {
    console.error(e);
    alert("Erro ao enviar o e-mail");
  } finally {
    enviando.value = false;
  }
};
</script>
