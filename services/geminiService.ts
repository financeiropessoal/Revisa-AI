import { GoogleGenAI, Type } from "@google/genai";
import { DifficultyLevel } from "../types";

export interface GeneratedCardData {
  front: string;
  back: string;
  legalText: string;
  legalReference: string;
  options: string[];
  correctAnswer: string;
  difficulty: DifficultyLevel;
}

export const generateLegalFlashcards = async (
  subject: string,
  topic: string,
  quantity: number,
  difficultyMode: 'easy' | 'medium' | 'hard' | 'mixed'
): Promise<GeneratedCardData[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY não encontrada. Configure as variáveis de ambiente.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview"; 

  let difficultyInstruction = "";
  switch (difficultyMode) {
    case 'easy':
        difficultyInstruction = "Nível FÁCIL: Literalidade direta, conceitos básicos e preenchimento de lacunas óbvias.";
        break;
    case 'medium':
        difficultyInstruction = "Nível MÉDIO: Casos práticos simples ou distinções entre conceitos semelhantes.";
        break;
    case 'hard':
        difficultyInstruction = "Nível DIFÍCIL: Exceções, prazos específicos, pegadinhas e combinações de parágrafos.";
        break;
    case 'mixed':
        difficultyInstruction = "Mistura: 30% fáceis, 40% médias, 30% difíceis.";
        break;
  }

  const prompt = `
    Gere ${quantity} flashcards de "Lei Seca" para concursos.
    Matéria: "${subject}".
    Tópico: "${topic}".
    
    Dificuldade: ${difficultyInstruction}
    
    REGRAS:
    1. Baseie-se apenas no texto literal da lei ou tratados.
    2. 20% das cartas devem ser "COMPLETE A LACUNA" usando "__________".
    3. Gere 4 opções de resposta.
    4. Indique a resposta correta.
    5. No verso (back), dê uma explicação curta.
    6. No campo "legalText", coloque o artigo literal com a resposta em **negrito**.
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
    console.error("Erro na geração Gemini:", error);
    throw error;
  }
};