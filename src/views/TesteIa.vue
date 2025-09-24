<template>
  <div class="container">
    <h2>Formulário com IA</h2>

    <BInput v-model="prompt" placeholder="Nome do produto" />
    <br />
    <BButton @click="gerarCampos">Gerar Campos</BButton>

    <div v-if="loading">Aguarde, gerando...</div>

    <div v-if="erro" class="erro">Erro: {{ erro }}</div>

    <div v-if="palavras_chave">
      <h3>Palavras-chave</h3>
      <BFormTextarea v-model="palavras_chave" placeholder="Palavras-chave" />
      <span class="float-end" v-if="palavras_chave">
        <BTooltip>
          <template #target>
            <BButton
              size="sm"
              class="mx-1"
              variant="outline-secondary"
              @click="copiarValor(String(palavras_chave))"
              >📋</BButton
            >
          </template>
          Copiar valor
        </BTooltip>
      </span>
    </div>
    <div v-if="titulos">
      <h3>Título</h3>
      <BInput v-model="titulos" placeholder="Título" />
      <span class="float-end" v-if="titulos">
        <BTooltip>
          <template #target>
            <BButton
              size="sm"
              class="mx-1"
              variant="outline-secondary"
              @click="copiarValor(String(titulos))"
              >📋</BButton
            >
          </template>
          Copiar valor
        </BTooltip>
      </span>
    </div>
    <div v-if="descricoes">
      <h3>Descrição</h3>
      <BFormTextarea v-model="descricoes" placeholder="Descrição" />
      <span class="float-end" v-if="descricoes">
        <BTooltip>
          <template #target>
            <BButton
              size="sm"
              class="mx-1"
              variant="outline-secondary"
              @click="copiarValor(String(descricoes))"
              >📋</BButton
            >
          </template>
          Copiar valor
        </BTooltip>
      </span>
    </div>
    <div v-if="bullet_points.bulletpoint_um">
      <h3>Bullet Points</h3>
      <div class="row">
        <div class="col-md-12">
          <BInput
            v-model="bullet_points.bulletpoint_um"
            placeholder="Bullet Point 1"
          />
          <span class="float-end">
            <BTooltip>
              <template #target>
                <BButton
                  size="sm"
                  class="mx-1"
                  variant="outline-secondary"
                  @click="copiarValor(String(bullet_points.bulletpoint_um))"
                  >📋</BButton
                >
              </template>
              Copiar valor
            </BTooltip>
          </span>
        </div>
        <div class="col-md-12">
          <BInput
            v-model="bullet_points.bulletpoint_dois"
            placeholder="Bullet Point 2"
          />
          <span class="float-end">
            <BTooltip>
              <template #target>
                <BButton
                  size="sm"
                  class="mx-1"
                  variant="outline-secondary"
                  @click="copiarValor(String(bullet_points.bulletpoint_dois))"
                  >📋</BButton
                >
              </template>
              Copiar valor
            </BTooltip>
          </span>
        </div>
        <div class="col-md-12">
          <BInput
            v-model="bullet_points.bulletpoint_tres"
            placeholder="Bullet Point 3"
          />
          <span class="float-end">
            <BTooltip>
              <template #target>
                <BButton
                  size="sm"
                  class="mx-1"
                  variant="outline-secondary"
                  @click="copiarValor(String(bullet_points.bulletpoint_tres))"
                  >📋</BButton
                >
              </template>
              Copiar valor
            </BTooltip>
          </span>
        </div>
        <div class="col-md-12">
          <BInput
            v-model="bullet_points.bulletpoint_quatro"
            placeholder="Bullet Point 4"
          />
          <span class="float-end">
            <BTooltip>
              <template #target>
                <BButton
                  size="sm"
                  class="mx-1"
                  variant="outline-secondary"
                  @click="copiarValor(String(bullet_points.bulletpoint_quatro))"
                  >📋</BButton
                >
              </template>
              Copiar valor
            </BTooltip>
          </span>
        </div>
        <div class="col-md-12">
          <BInput
            v-model="bullet_points.bulletpoint_cinco"
            placeholder="Bullet Point 5"
          />
          <span class="float-end">
            <BTooltip>
              <template #target>
                <BButton
                  size="sm"
                  class="mx-1"
                  variant="outline-secondary"
                  @click="copiarValor(String(bullet_points.bulletpoint_cinco))"
                  >📋</BButton
                >
              </template>
              Copiar valor
            </BTooltip>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { BInput, BButton, BTooltip, BFormTextarea } from "bootstrap-vue-next";

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

function copiarValor(val: string) {
  if (val) navigator.clipboard.writeText(val);
}

const gerarCampos = async () => {
  erro.value = null;
  loading.value = true;
  try {
    const response = await fetch("https://gerenciamento-lojas-calculadora-precos.onrender.com/ia/generate", {
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
        bulletpoint_um: data.bullet_points.bulletpoint_1 || "",
        bulletpoint_dois: data.bullet_points.bulletpoint_2 || "",
        bulletpoint_tres: data.bullet_points.bulletpoint_3 || "",
        bulletpoint_quatro: data.bullet_points.bulletpoint_4 || "",
        bulletpoint_cinco: data.bullet_points.bulletpoint_5 || "",
      };
    }
  } catch (e) {
    alert("Erro de conexão com o servidor.");
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
