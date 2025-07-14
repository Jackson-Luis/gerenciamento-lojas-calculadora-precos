<template>
    <div class="calculadora-view">
        <BInputGroup prepend="R$">
            <BFormInput v-model="valor" type="number" placeholder="Valor do produto em R$" />
        </BInputGroup>
        <br />
        <BFormSelect v-model="fornecedorSelecionado" :options="fornecedores" class="mb-3" value-field="item" text-field="name"
            disabled-field="notEnabled" />
        <div class="mt-4">
            <BCardGroup deck>
                <BCard v-b-color-mode="'light'" title="Shopee">
                    <br />
                    <strong>Cálculos com lucro em:</strong>
                    <br /><br />
                    <BListGroup>
                        <BListGroupItem>
                            <div class="d-flex align-items-center justify-content-between">
                                <BFormInput v-model="porcentagemVarianteShopee" type="number" placeholder="Porcentagem variante" style="width: 250px;"/>
                                {{porcentagemVarianteShopee}}% - R$ {{resultadoVarianteShopee}}
                                <BButton v-if="resultadoVarianteShopee" size="sm" class="mx-1" variant="outline-secondary" @click="copiarValor(String(resultadoVarianteShopee))">📋</BButton>
                            </div>
                        </BListGroupItem>
                        <BListGroupItem v-for="(item, idx) in shopeeCalculos" :key="'shopee-'+idx">
                            {{ percentuais[idx] }}% - R$ {{ item }}
                            <span class="float-end" v-if="valor">
                                <BTooltip>
                                    <template #target>
                                        <BButton size="sm" class="mx-1" variant="outline-secondary"
                                            @click="copiarValor(String(item))">📋</BButton>
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
                                <BFormInput v-model="porcentagemVarianteAmazon" type="number" placeholder="Porcentagem variante" style="width: 250px;"/>
                                {{porcentagemVarianteAmazon}}% - R$ {{resultadoVarianteAmazon}}
                                <BButton v-if="resultadoVarianteAmazon" size="sm" class="mx-1" variant="outline-secondary" @click="copiarValor(String(resultadoVarianteAmazon))">📋</BButton>
                            </div>
                        </BListGroupItem>
                        <BListGroupItem v-for="(item, idx) in amazonCalculos" :key="'amazon-'+idx">
                            {{ percentuais[idx] }}% - R$ {{ item }}
                            <span class="float-end" v-if="valor">
                                <BTooltip>
                                    <template #target>
                                        <BButton size="sm" class="mx-1" variant="outline-secondary"
                                            @click="copiarValor(String(item))">📋</BButton>
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
import { ref, computed } from 'vue'
import { BFormInput, BCard, BCardGroup, BListGroup, BListGroupItem, BInputGroup, BButton, BTooltip, BFormSelect } from 'bootstrap-vue-next'

const valor = ref<number | string>('')
const porcentagemVarianteAmazon = ref<number | string>('')
const porcentagemVarianteShopee = ref<number | string>('')

// Calcula o resultado variante para Shopee e Amazon automaticamente ao digitar valor ou porcentagem
const resultadoVarianteShopee = computed(() => {
    const v = Number(valor.value)
    const p = Number(porcentagemVarianteShopee.value)
    if (!v || !p) return ''
    let baseValor = v
    if (fornecedorSelecionado.value === 2.50 && baseValor <= 10) baseValor += 2.50
    // Shopee: taxa 22% + 3 fixo
    const taxaShopee = 0.22 * baseValor
    const baseAcumulado = baseValor + taxaShopee
    const pAcumulado = p / 100 * baseAcumulado
    const total = baseAcumulado + pAcumulado + 3
    return total.toFixed(2).replace('.', ',')
})

const resultadoVarianteAmazon = computed(() => {
    const v = Number(valor.value)
    const p = Number(porcentagemVarianteAmazon.value)
    if (!v || !p) return ''
    let baseValor = v
    if (fornecedorSelecionado.value === 2.50 && baseValor <= 10) baseValor += 2.50
    // Amazon: taxa 15% + 4.5 ou 8 fixo
    const taxaAmazon = 0.15 * baseValor
    const baseAcumulado = baseValor + taxaAmazon
    const pAcumulado = p / 100 * baseAcumulado
    let adicional = baseAcumulado + pAcumulado >= 30 ? 8 : 4.5
    const total = baseAcumulado + pAcumulado + adicional
    return total.toFixed(2).replace('.', ',')
})

const fornecedorSelecionado = ref(0)
const fornecedores = [
    { item: 0, name: 'Selecione esse caso não haja taxa' },
    { item: 2.50 , name: 'Jonh Variedades Drop' }
]
const percentuais = [5, 10, 15, 20, 25]

function copiarValor(val: string) {
    if (val) navigator.clipboard.writeText(val)
}

function calcularMarketplace(base: number, taxa: number, percentuais: number[], adicional?: (acumulado: number) => number) {
    let baseValor = base
    const acumuladoTaxa = taxa * baseValor
    let baseAcumulado = baseValor + acumuladoTaxa
    return percentuais.map((p) => {
        const pAcumulado = p / 100 * baseAcumulado
        let total = baseAcumulado + pAcumulado
        if (adicional) total += adicional(total)
        return total.toFixed(2).replace('.', ',')
    })
}

const shopeeCalculos = computed(() => {
    if (!valor.value) return [null, null, null, null, null]
    let baseValor = Number(valor.value)
    if (fornecedorSelecionado.value === 2.50 && baseValor <= 10) baseValor += 2.50
    return calcularMarketplace(
        baseValor,
        0.22,
        percentuais,
        (total) => 3
    )
})

const amazonCalculos = computed(() => {
    if (!valor.value) return [null, null, null, null, null]
    let baseValor = Number(valor.value)
    if (fornecedorSelecionado.value === 2.50 && baseValor <= 10) baseValor += 2.50
    return calcularMarketplace(
        baseValor,
        0.15,
        percentuais,
        (total) => total >= 30 ? 8 : 4.5
    )
})
</script>
