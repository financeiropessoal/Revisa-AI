import { GoogleGenAI, Type } from "@google/genai";
import { DifficultyLevel } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

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
  const ai = getClient();
  const modelId = "gemini-3-flash-preview"; 

  let difficultyInstruction = "";
  switch (difficultyMode) {
    case 'easy':
        difficultyInstruction = "Nível FÁCIL: Literalidade direta. Complete a lacuna ou pergunta direta sobre o texto da lei.";
        break;
    case 'medium':
        difficultyInstruction = "Nível MÉDIO: Aplicação direta em casos simples ou distinção entre conceitos próximos da lei.";
        break;
    case 'hard':
        difficultyInstruction = "Nível DIFÍCIL: Exceções, prazos específicos, combinações de parágrafos e 'pegadinhas' clássicas de concursos.";
        break;
    case 'mixed':
        difficultyInstruction = "Mistura equilibrada de dificuldades (Fácil, Médio e Difícil).";
        break;
  }

  const prompt = `
    Atue como um especialista em elaboração de questões para concursos jurídicos de alto nível (Magistratura, MP, Defensoria).
    Gere ${quantity} flashcards focados EXCLUSIVAMENTE na "Lei Seca" (texto literal) brasileira.
    
    Matéria: "${subject}"
    Assunto: "${topic}"
    Diretrizes: ${difficultyInstruction}
    
    REQUISITOS TÉCNICOS:
    1. O "front" deve ser uma pergunta clara e desafiadora.
    2. O "options" deve conter 4 alternativas plausíveis.
    3. O "correctAnswer" deve ser a alternativa correta exata.
    4. O "back" deve explicar POR QUE aquela é a resposta, citando a lógica da lei.
    5. O "legalText" deve ser o ARTIGO COMPLETO da lei. Use markdown **negrito** para destacar a parte que responde à pergunta.
    6. O "legalReference" deve seguir o padrão: "Art. X, Lei Y" (Ex: Art. 121, CP).
    
    Responda APENAS em JSON seguindo o esquema fornecido.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
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

    if (response.text) {
      return JSON.parse(response.text) as GeneratedCardData[];
    }
    return [];
  } catch (error) {
    console.error("Erro na geração Gemini:", error);
    throw error;
  }
};