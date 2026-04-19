import { GoogleGenAI, Type } from '@google/genai';
import { Transaction, Category } from '../types';

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function getSpendingInsights(transactions: Transaction[], categories: Category[]): Promise<string> {
  try {
    const ai = getAI();
    if (!ai) {
      return "Configuração de IA ausente. Verifique a chave da API.";
    }
    
    const prompt = `
      Analise as seguintes transações financeiras e forneça insights acionáveis para otimização de gastos.
      Seja direto, encorajador e dê 2 a 3 dicas práticas baseadas nos dados.
      
      Transações:
      ${JSON.stringify(transactions)}
      
      Categorias:
      ${JSON.stringify(categories)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "Você é um consultor financeiro pessoal experiente e amigável, focado em ajudar o usuário a economizar dinheiro e atingir seus objetivos financeiros.",
      }
    });

    return response.text || "Não foi possível gerar insights no momento.";
  } catch (error) {
    console.error("Error generating insights:", error);
    return "Ocorreu um erro ao gerar seus insights. Tente novamente mais tarde.";
  }
}

export async function autoCategorizeTransaction(description: string, amount: number, categories: Category[]): Promise<string | null> {
  try {
    const ai = getAI();
    if (!ai) return null;

    const prompt = `
      Dada a descrição de uma transação financeira e o valor, determine a categoria mais apropriada da lista fornecida.
      Retorne APENAS o ID da categoria, ou nulo se nenhuma se aplicar.
      
      Descrição: "${description}"
      Valor: ${amount}
      
      Categorias disponíveis:
      ${JSON.stringify(categories.map(c => ({ id: c.id, name: c.name, type: c.type })))}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categoryId: {
              type: Type.STRING,
              description: "O ID da categoria escolhida, ou null se nenhuma for adequada."
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result.categoryId || null;
  } catch (error) {
    console.error("Error categorizing transaction:", error);
    return null;
  }
}

export async function searchSystem(query: string, context: any): Promise<string> {
  try {
    const ai = getAI();
    if (!ai) return "Sistema de busca indisponível.";

    const prompt = `
      O usuário está fazendo uma busca ou pergunta sobre o sistema financeiro "Dindin".
      Sua tarefa é responder à pergunta ou fornecer informações relevantes com base no contexto fornecido.
      
      Contexto do Sistema:
      - Transações recentes: ${JSON.stringify(context.transactions?.slice(0, 10))}
      - Categorias: ${JSON.stringify(context.categories)}
      - Metas: ${JSON.stringify(context.goals)}
      - Configurações: ${JSON.stringify(context.userSettings)}
      
      Pergunta/Busca: "${query}"
      
      Responda de forma concisa e útil. Se for uma dúvida sobre o funcionamento, explique como usar o recurso.
      Se for uma busca por dados, resuma o que encontrou.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Você é o assistente inteligente do Dindin, um app de finanças. Você ajuda os usuários a encontrar informações e entender como o app funciona.",
      }
    });

    return response.text || "Nenhum resultado encontrado.";
  } catch (error) {
    console.error("Error in system search:", error);
    return "Ocorreu um erro ao processar sua busca.";
  }
}

export async function detectGender(name: string): Promise<'male' | 'female' | 'neutral'> {
  try {
    const ai = getAI();
    if (!ai) return 'neutral';

    const prompt = `
      Determine o gênero do nome "${name}".
      Responda apenas com 'male', 'female' ou 'neutral'.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    const result = response.text?.trim().toLowerCase() || 'neutral';
    if (['male', 'female', 'neutral'].includes(result)) {
      return result as 'male' | 'female' | 'neutral';
    }
    return 'neutral';
  } catch (error) {
    console.error("Error detecting gender:", error);
    return 'neutral';
  }
}
