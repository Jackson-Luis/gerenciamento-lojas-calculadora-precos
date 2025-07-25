<template>
  <div class="container">
    <h2>Formulário com IA</h2>

    <BInput v-model="prompt" placeholder="Digite seu prompt..." />

    <BButton @click="gerarCampos">Gerar Campos</BButton>

    <div v-if="loading">Aguarde, gerando...</div>

    <div v-if="erro" class="erro">Erro: {{ erro }}</div>

    <div v-if="palavras_chave">
      <h3>Palavras-chave</h3>
      <BInput v-model="palavras_chave" placeholder="Palavras-chave" />
    </div>

    <div v-if="titulos">
      <h3>Títulos</h3>
      <BInput v-model="titulos" placeholder="Títulos" />
    </div>

    <div v-if="descricoes">
      <h3>Descrições</h3>
      <BInput v-model="descricoes" placeholder="Descrições" />
    </div>

    <div v-if="bullet_points">
      <h3>Bullet Points</h3>
      <BInput
        v-model="bullet_points.bulletpoint_um"
        placeholder="Bullet Point 1"
      />
      <BInput
        v-model="bullet_points.bulletpoint_dois"
        placeholder="Bullet Point 2"
      />
      <BInput   
        v-model="bullet_points.bulletpoint_tres"
        placeholder="Bullet Point 3"
      />
      <BInput
        v-model="bullet_points.bulletpoint_quatro"
        placeholder="Bullet Point 4"
      />
      <BInput
        v-model="bullet_points.bulletpoint_cinco"
        placeholder="Bullet Point 5"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { BInput, BButton } from "bootstrap-vue-next";

const prompt = ref("");
const palavras_chave = ref("");
const titulos = ref("");
const descricoes = ref("");
const bullet_points = ref({
  bulletpoint_um: "",
  bulletpoint_dois: "",
  bulletpoint_tres: "",
  bulletpoint_quatro: "",
  bulletpoint_cinco: "",
});
const loading = ref(false);
const erro = ref(null);

const gerarCampos = async () => {
  erro.value = null;
  loading.value = true;
  try {
    const response = await fetch("http://localhost:3001/api/preencher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt.value }),
    });

    const data = await response.json();
    console.log(data);
    if (data.error) {
      erro.value = data.error;
    } else {
      palavras_chave.value = data.palavras_chave || "";
      titulos.value = data.titulos || "";
      descricoes.value = data.descricoes || "";
      bullet_points.value = {
        bulletpoint_um: data.bullet_points.bulletpoint_um || "",
        bulletpoint_dois: data.bullet_points.bulletpoint_dois || "",
        bulletpoint_tres: data.bullet_points.bulletpoint_tres || "",
        bulletpoint_quatro: data.bullet_points.bulletpoint_quatro || "",
        bulletpoint_cinco: data.bullet_points.bulletpoint_cinco || "",
      };
    }
  } catch (e) {
    erro.value = "Erro de conexão com o servidor.";
  } finally {
    loading.value = false;
  }
};
</script>

<style>
.container {
  max-width: 500px;
  margin: auto;
  padding: 2rem;
}
input {
  display: block;
  margin-bottom: 10px;
  width: 100%;
  padding: 8px;
}
.erro {
  color: red;
  margin-bottom: 10px;
}
</style>
