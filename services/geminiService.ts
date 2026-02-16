import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedCardData, DifficultyLevel } from "../types";

// Re-export interface for use in other files
export type { GeneratedCardData };

const generateBatch = async (
  ai: GoogleGenAI,
  model: string,
  subject: string,
  topic: string,
  count: number,
  difficultyInstruction: string
): Promise<GeneratedCardData[]> => {
  // Random seed to ensure variety across parallel batches
  const seed = Math.floor(Math.random() * 1000000);

  const prompt = `
    Atue como um EXAMINADOR de concursos.
    Gere ${count} flashcards focados EXCLUSIVAMENTE na "Lei Seca" (texto legal).
    
    Matéria: "${subject}".
    Tópico: "${topic}".
    
    Diretriz: ${difficultyInstruction}
    
    REGRAS:
    1. Baseie-se apenas no texto literal da lei.
    2. Crie distratores (alternativas erradas) PLAUSÍVEIS.
    3. Gere 4 opções.
    4. Indique a correta.
    5. No verso (back), explique o erro das outras ou a lógica.
    6. "legalText": coloque o artigo literal com a resposta em **negrito**.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        temperature: 1, // High creativity to avoid duplicates
        seed: seed, // Random seed per batch
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
    if (!text) return [];
    
    return JSON.parse(text) as GeneratedCardData[];
  } catch (error) {
    console.warn("Erro em um lote de geração:", error);
    return []; // Return empty for this batch so others can succeed
  }
};

export const generateLegalFlashcards = async (
  subject: string,
  topic: string,
  quantity: number,
  difficultyMode: 'easy' | 'medium' | 'hard' | 'mixed'
): Promise<GeneratedCardData[]> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING: Chave de API inválida ou não encontrada.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview"; 

  let difficultyInstruction = "";
  switch (difficultyMode) {
    case 'easy':
        difficultyInstruction = "Nível BÁSICO: Literalidade, prazos e quóruns. Evite óbvio.";
        break;
    case 'medium':
        difficultyInstruction = "Nível INTERMEDIÁRIO: Casos práticos e distinção de conceitos.";
        break;
    case 'hard':
        difficultyInstruction = "Nível AVANÇADO: Exceções, detalhes minuciosos e pegadinhas.";
        break;
    case 'mixed':
        difficultyInstruction = "Mistura: 30% literais, 40% práticos, 30% exceções difíceis.";
        break;
  }

  // Parallelization Strategy:
  // Break the total quantity into small batches (e.g., 5 cards per request).
  // Run them in parallel using Promise.all.
  // This significantly reduces the total wait time (latency) compared to generating 20+ cards sequentially.
  
  const BATCH_SIZE = 5;
  const promises = [];
  let remaining = quantity;

  while (remaining > 0) {
    const currentBatchSize = Math.min(remaining, BATCH_SIZE);
    promises.push(generateBatch(ai, model, subject, topic, currentBatchSize, difficultyInstruction));
    remaining -= currentBatchSize;
  }

  try {
    const results = await Promise.all(promises);
    // Flatten the array of arrays into a single array
    const allCards = results.flat();
    
    if (allCards.length === 0) {
        throw new Error("A IA não retornou nenhum card válido.");
    }

    return allCards;
  } catch (error) {
    console.error("Erro geral na geração paralela:", error);
    throw error;
  }
};