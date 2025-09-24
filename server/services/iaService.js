// services/iaService.js
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY_TESTE });

export async function gerarConteudoIAComMesmoMolde(prompt) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-nano-2025-04-14",
    messages: [
      {
        role: "user",
        content: `Com base nesse prompt: produto ["${prompt}"]
                tarefas:
                1. pesquise as palavras chave mais relevantes na busca do produto e as cite espaçadas por (;) e que seja no máximo 500 caracteres
                2. crie um titulo para anuncios, utilizando apenas as palavras chave com o limite minimo de 130 caracteres cada
                3. crie uma descrição com cerca de 120 palavras, lembre de ser convincente e incluir as especificações do produto
                4. crie 5 bullet points sofisticados para cada anuncio
                observações
                * Utilize linguagem persuasiva e focada em SEO.
                * Adapte o tom de voz e a linguagem ao público-alvo do produto.
                * Mantenha a formatação clara e organizada para facilitar a leitura e a aplicação das informações.
                * gere em formato JSON, com os campos: "palavras_chave", "titulos", "descricoes", "bullet_points"
                * dentro de bullet_points, deve ter 5 bullet points distintos no máximo
                * em bulletpoints deve ser também um objeto com cada como bulletpoint_1, e o valor como o bullet point e assim por diante`,
      },
    ],
  });
  const bruto = completion.choices[0]?.message?.content || "";
  const limpo = String(bruto)
    .replace(/^```json\s*/i, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(limpo);
}
