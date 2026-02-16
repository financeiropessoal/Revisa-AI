import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedCardData, DifficultyLevel } from "../types";

// Re-export interface for use in other files
export type { GeneratedCardData };

export const generateLegalFlashcards = async (
  subject: string,
  topic: string,
  quantity: number,
  difficultyMode: 'easy' | 'medium' | 'hard' | 'mixed'
): Promise<GeneratedCardData[]> => {
  const apiKey = process.env.API_KEY;
  
  // Verificação estrita da chave
  if (!apiKey || apiKey.trim() === '' || apiKey === 'undefined') {
    throw new Error("API_KEY_MISSING: A chave de API não foi encontrada. Verifique as Variáveis de Ambiente no painel da Vercel.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview"; 

  let difficultyInstruction = "";
  switch (difficultyMode) {
    case 'easy':
        difficultyInstruction = "Nível BÁSICO (Padrão Banca Examinadora): Foco na literalidade da lei, mas cobrando prazos, quóruns e palavras-chave que confundem (ex: 'poderá' vs 'deverá', 'salvo' vs 'inclusive'). NÃO crie perguntas óbvias ou ingênuas.";
        break;
    case 'medium':
        difficultyInstruction = "Nível INTERMEDIÁRIO: Situações hipotéticas (casos práticos) que exigem a aplicação da lei (subsunção). Exige distinção clara entre conceitos semelhantes.";
        break;
    case 'hard':
        difficultyInstruction = "Nível AVANÇADO: Cobrança de exceções das exceções, parágrafos pouco lidos, competências exclusivas vs privativas, e detalhes minuciosos. Estilo 'pegadinha' de alto nível.";
        break;
    case 'mixed':
        difficultyInstruction = "Mistura equilibrada: 30% literais com pegadinhas (básico), 40% casos práticos (médio), 30% detalhes obscuros e exceções (avançado).";
        break;
  }

  const prompt = `
    Atue como um EXAMINADOR RIGOROSO de concursos públicos de alto nível (Juiz, Promotor, Defensor).
    Gere ${quantity} flashcards focados EXCLUSIVAMENTE na "Lei Seca" (texto legal).
    
    Matéria: "${subject}".
    Tópico: "${topic}".
    
    Diretriz de Dificuldade: ${difficultyInstruction}
    
    REGRAS RÍGIDAS DE CRIAÇÃO:
    1. Baseie-se apenas no texto literal da lei ou tratados vigentes.
    2. Crie distratores (alternativas erradas) PLAUSÍVEIS. O candidato deve ficar em dúvida. Não use alternativas absurdas.
    3. Se usar "COMPLETE A LACUNA" (max 20%), oculte palavras determinantes para o sentido jurídico, nunca artigos ou preposições irrelevantes.
    4. Gere 4 opções de resposta.
    5. Indique a resposta correta.
    6. No verso (back), explique de forma técnica o erro das outras ou a lógica da correta.
    7. No campo "legalText", coloque o artigo literal com a resposta em **negrito**.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.STRING },
              back: { type: Type.STRING },
              legalText: { type: Type.STRING },
              legalReference: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"] }
            },
            required: ["front", "back", "legalText", "legalReference", "options", "correctAnswer", "difficulty"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Resposta vazia da IA");
    
    return JSON.parse(text) as GeneratedCardData[];
  } catch (error) {
    console.error("Erro detalhado na geração Gemini:", error);
    throw error;
  }
};