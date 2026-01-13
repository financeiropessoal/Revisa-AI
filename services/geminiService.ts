import { GoogleGenAI, Type } from "@google/genai";
import { DifficultyLevel } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment variables.");
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
        difficultyInstruction = "Gere APENAS questões de nível FÁCIL (easy). Foco na literalidade direta, conceitos básicos e preenchimento de lacunas óbvias da lei.";
        break;
    case 'medium':
        difficultyInstruction = "Gere APENAS questões de nível MÉDIO (medium). Crie pequenos casos práticos simples ou cobre distinções entre conceitos.";
        break;
    case 'hard':
        difficultyInstruction = "Gere APENAS questões de nível DIFÍCIL (hard). Foque em exceções, prazos específicos, combinações de parágrafos/incisos, ou 'pegadinhas' sutis da lei seca.";
        break;
    case 'mixed':
        difficultyInstruction = "Gere uma mistura equilibrada: aprox. 30% fáceis, 40% médias e 30% difíceis.";
        break;
  }

  const prompt = `
    Gere ${quantity} flashcards para estudo de concursos públicos.
    Matéria Principal: "${subject}".
    Assunto Específico: "${topic}".
    
    Diretrizes de Dificuldade:
    ${difficultyInstruction}
    
    Requisitos OBRIGATÓRIOS:
    1. Baseie-se estritamente na "Lei Seca" (texto literal da lei) ou Tratados Internacionais.
    
    2. DINÂMICA DE ESTILO (IMPORTANTE):
       - Aprox. 80% das cartas devem ser perguntas objetivas convencionais ou situações hipotéticas.
       - Aprox. 20% (1 a cada 5 cartas, de forma aleatória) deve ser do tipo "COMPLETE A LACUNA":
         * No campo "front", cite o texto literal da lei, mas substitua uma palavra-chave, prazo, percentual ou termo técnico por "__________" (10 underlines).
         * Exemplo: "Art. X: A casa é asilo __________ do indivíduo..."
         * A resposta correta deve ser o termo faltante.
         * As opções erradas devem ser termos que causam confusão comum.

    3. Gere 4 opções de resposta curtas no campo "options".
    4. Indique a resposta correta no campo "correctAnswer".
    5. O campo "back" (verso) deve conter a explicação clara e sucinta.
    6. O campo "legalText" deve conter a cópia literal do artigo de lei completo. Use markdown (**negrito**) para grifar a resposta/termo que estava oculto.
    7. O campo "difficulty" deve ser preenchido com 'easy', 'medium' ou 'hard' para cada carta.
    8. O campo "legalReference" deve citar o artigo e a lei.
    9. Use a ferramenta de busca para garantir legislação atualizada.
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
              front: { type: Type.STRING, description: "A pergunta ou o texto da lei com a lacuna '__________'." },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "4 alternativas." },
              correctAnswer: { type: Type.STRING, description: "Alternativa correta (o termo que preenche a lacuna)." },
              back: { type: Type.STRING, description: "Explicação." },
              legalText: { type: Type.STRING, description: "Texto de lei completo com grifos markdown." },
              legalReference: { type: Type.STRING, description: "Ref. legal (Art. X)." },
              difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"], description: "Nível da questão." }
            },
            required: ["front", "back", "legalText", "legalReference", "options", "correctAnswer", "difficulty"],
          },
        },
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text) as GeneratedCardData[];
      return data;
    }
    
    return [];
  } catch (error) {
    console.error("Error generating flashcards:", error);
    throw error;
  }
};