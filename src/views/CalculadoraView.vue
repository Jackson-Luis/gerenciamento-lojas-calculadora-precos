<template>
  <div class="calculadora-view">
    <BInputGroup prepend="R$">
      <BFormInput
        v-model="valor"
        type="number"
        placeholder="Valor do produto em R$"
        min="0"
      />
    </BInputGroup>
    <br />
    <BFormSelect
      v-model="fornecedorSelecionado"
      :options="fornecedores"
      class="mb-3"
      value-field="item"
      text-field="name"
      disabled-field="notEnabled"
    />
    <div class="mt-4">
      <BCardGroup deck>
        <BCard v-b-color-mode="'light'" title="Shopee">
          <br />
          <strong>Cálculos com lucro em:</strong>
          <br /><br />
          <BListGroup>
            <BListGroupItem>
              <div class="d-flex align-items-center justify-content-between">
                <BFormInput
                  v-model="porcentagemVarianteShopee"
                  type="number"
                  placeholder="Porcentagem variante"
                  style="width: 250px"
                />
                <div v-if="porcentagemVarianteShopee && valor">
                  {{ porcentagemVarianteShopee }}% - R$
                  <span v-if="resultadoVarianteShopee && typeof resultadoVarianteShopee === 'object'">
                    {{ resultadoVarianteShopee.total }} - Lucro: R$
                    {{ resultadoVarianteShopee.lucro }}
                  </span>
                </div>
                <BButton
                  v-if="resultadoVarianteShopee"
                  size="sm"
                  class="mx-1"
                  variant="outline-secondary"
                  @click="copiarValor(String(resultadoVarianteShopee.total))"
                  >📋</BButton
                >
              </div>
            </BListGroupItem>
            <BListGroupItem
              v-for="(item, idx) in shopeeCalculos"
              :key="'shopee-' + idx"
            >
              {{ percentuais[idx] }}% - R$ {{ item?.total }} - Lucro: R$
              {{ item?.lucro }}
              <span class="float-end" v-if="valor">
                <BTooltip>
                  <template #target>
                    <BButton
                      size="sm"
                      class="mx-1"
                      variant="outline-secondary"
                      @click="item && copiarValor(String(item.total))"
                      >📋</BButton
                    >
                  </template>
                  Copiar valor
                </BTooltip>
              </span>
            </BListGroupItem>
          </BListGroup>
        </BCard>
        <BCard v-b-color-mode="'light'" title="Amazon">
          <br />
          <strong>Cálculos com lucro em:</strong>
          <br /><br />
          <BListGroup>
            <BListGroupItem>
              <div class="d-flex align-items-center justify-content-between">
                <BFormInput
                  v-model="porcentagemVarianteAmazon"
                  type="number"
                  placeholder="Porcentagem variante"
                  style="width: 250px"
                />
                <div v-if="porcentagemVarianteAmazon && valor && resultadoVarianteAmazon && typeof resultadoVarianteAmazon === 'object'">
                  {{ porcentagemVarianteAmazon }}% - R$
                  {{ resultadoVarianteAmazon.total }} - Lucro: R$
                  {{ resultadoVarianteAmazon.lucro }}
                </div>
                <BButton
                  v-if="resultadoVarianteAmazon"
                  size="sm"
                  class="mx-1"
                  variant="outline-secondary"
                  @click="copiarValor(String(resultadoVarianteAmazon.total))"
                  >📋</BButton
                >
              </div>
            </BListGroupItem>
            <BListGroupItem
              v-for="(item, idx) in amazonCalculos"
              :key="'amazon-' + idx"
            >
              {{ percentuais[idx] }}% - R$ {{ item?.total }} - Lucro: R$
              {{ item?.lucro }}
              <span class="float-end" v-if="valor">
                <BTooltip>
                  <template #target>
                    <BButton
                      size="sm"
                      class="mx-1"
                      variant="outline-secondary"
                      @click="item && copiarValor(String(item.total))"
                      >📋</BButton
                    >
                  </template>
                  Copiar valor
                </BTooltip>
              </span>
            </BListGroupItem>
          </BListGroup>
        </BCard>
      </BCardGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import {
  BFormInput,
  BCard,
  BCardGroup,
  BListGroup,
  BListGroupItem,
  BInputGroup,
  BButton,
  BTooltip,
  BFormSelect,
} from "bootstrap-vue-next";

const valor = ref<number | string>("");
const porcentagemVarianteAmazon = ref<number | string>("");
const porcentagemVarianteShopee = ref<number | string>("");

// Calcula o resultado variante para Shopee e Amazon automaticamente ao digitar valor ou porcentagem
const resultadoVarianteShopee = computed(() => {
  const v = Number(valor.value);
  const p = Number(porcentagemVarianteShopee.value);
  if (!v || !p) return "";
  let baseValor = v;
  if (fornecedorSelecionado.value === 2.5 && baseValor <= 10) baseValor += 2.5;

  const custoComFrete = baseValor + 4;
  const custoComTaxa = custoComFrete * (1 + 20 / 100);
  const custoComTransicao = custoComTaxa + 3;
  const custoComAdicional = custoComTransicao * (1 + 2 / 100);
  const totalLucro = custoComAdicional * (p / 100);
  const total = custoComAdicional + totalLucro;

    console.log("Custo com frete:", custoComFrete); 
    console.log("Custo com taxa:", custoComTaxa);
    console.log("Custo com transição:", custoComTransicao);
    console.log("Custo com adicional:", custoComAdicional);

  return {
    total: total.toFixed(2).replace(".", ","),
    lucro: totalLucro.toFixed(2).replace(".", ","),
  };
});

const resultadoVarianteAmazon = computed(() => {
  const v = Number(valor.value);
  const p = Number(porcentagemVarianteAmazon.value);
  if (!v || !p) return "";
  let baseValor = v;
  if (fornecedorSelecionado.value === 2.5 && baseValor <= 10) baseValor += 2.5;
  // Amazon: taxa 15% + 4.5 ou 8 fixo
  const taxaAmazon = 0.15 * baseValor;
  const baseAcumulado = baseValor + taxaAmazon;
  const pAcumulado = (p / 100) * baseAcumulado;
  let adicional = baseAcumulado + pAcumulado >= 30 ? 8 : 4.5;
  const total = baseAcumulado + pAcumulado + adicional;
  return {
    total: total.toFixed(2).replace(".", ","),
    lucro: pAcumulado.toFixed(2).replace(".", ","),
  };
});

const fornecedorSelecionado = ref(0);
const fornecedores = [
  { item: 0, name: "Selecione esse caso não haja taxa" },
  { item: 2.5, name: "Jonh Variedades Drop" },
];
const percentuais = [5, 10, 15, 20, 25];

function copiarValor(val: string) {
  if (val) navigator.clipboard.writeText(val);
}

function calcularMarketplaceAmazon(
  base: number,
  taxa: number,
  percentuais: number[],
  adicional?: (acumulado: number) => number
) {
  let baseValor = base;
  const acumuladoTaxa = taxa * baseValor;
  let baseAcumulado = baseValor + acumuladoTaxa;
  return percentuais.map((p) => {
    const pAcumulado = (p / 100) * baseAcumulado;
    let total = baseAcumulado + pAcumulado;
    if (adicional) total += adicional(total);
    return {
      lucro: pAcumulado.toFixed(2).replace(".", ","),
      total: total.toFixed(2).replace(".", ","),
    };
  });
}

function calcularMarketplaceShopee(
  custo: number,
  taxa: number,
  percentuais: number[],
  frete: number,
  transicao: number,
  adicionalPorcentagem: number
) {
  return percentuais.map((p) => {
    const custoComFrete = custo + frete;
    const custoComTaxa = custoComFrete * (1 + taxa / 100);
    const custoComTransicao = custoComTaxa + transicao;
    const custoComAdicional = custoComTransicao * (1 + adicionalPorcentagem / 100);
    const totalLucro = custoComAdicional * (p / 100);
    const total = custoComAdicional + totalLucro;
  
    return {
      lucro: totalLucro.toFixed(2).replace(".", ","),
      total: total.toFixed(2).replace(".", ","),
    }
  });
}

const shopeeCalculos = computed(() => {
  if (!valor.value) return [null, null, null, null, null];
  let baseValor = Number(valor.value);
  if (fornecedorSelecionado.value === 2.5 && baseValor <= 10) baseValor += 2.5;
  return calcularMarketplaceShopee(baseValor, 20, percentuais, 4, 3, 2);
});

const amazonCalculos = computed(() => {
  if (!valor.value) return [null, null, null, null, null];
  let baseValor = Number(valor.value);
  if (fornecedorSelecionado.value === 2.5 && baseValor <= 10) baseValor += 2.5;
  return calcularMarketplaceAmazon(baseValor, 0.15, percentuais, (total) =>
    total >= 30 ? 8 : 4.5
  );
});
</script>
