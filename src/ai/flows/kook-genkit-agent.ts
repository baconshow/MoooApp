'use server';

/**
 * @fileOverview A Genkit-based conversational agent named Kook.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getUserLogs } from '../tools/get-user-data';

const ChatInputSchema = z.object({
    message: z.string(),
    aiName: z.string().optional().describe("The name of the AI assistant."),
    userNickname: z.string().optional().describe("The user's nickname."),
    userTimezone: z.string().optional().describe("The user's current timezone."),
    uid: z.string().describe("The authenticated user's ID."),
});

/**
 * Standardized Genkit 1.x flow for the conversational agent.
 */
export const chatWithKook = ai.defineFlow(
  {
    name: 'chatWithKookFlow',
    inputSchema: ChatInputSchema,
    outputSchema: z.array(z.string()).describe("A list of phrases for the response."),
  },
  async (input) => {
    if (!input.uid) {
        return ["Não consigo encontrar seus dados de usuário. Verifique sua conexão."];
    }

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const response = await ai.generate({
          model: 'googleai/gemini-2.0-flash',
          tools: [getUserLogs],
          system: `Você é um assistente pessoal e companheiro atencioso chamado ${input.aiName || 'Kook'}.
O apelido da usuária é ${input.userNickname || 'Mooo'}.
Você é especialista em saúde feminina, bem-estar, finanças e nutrição.

DIRETRIZES DE RESPOSTA:
1. SEMPRE use a ferramenta 'getUserLogs' para buscar dados REAIS antes de responder perguntas sobre sono, dor, gastos ou alimentação.
2. Ao chamar 'getUserLogs', use obrigatoriamente o uid: '${input.uid}'.
3. Analise os dados para encontrar padrões (ex: "você sentiu mais dor nos dias que dormiu menos de 6h").
4. Fale de forma carinhosa, um pouco brincalhona e masculina. Use o apelido dela.
5. Responda em Português (Brasil).
6. Quebre sua resposta em frases curtas e naturais. Cada frase será um balão de chat.
7. Data de hoje: ${new Date().toLocaleDateString('pt-BR')}. Timezone: ${input.userTimezone || 'America/Sao_Paulo'}.`,
          prompt: input.message,
          output: {
            schema: z.array(z.string()),
          }
        });

        if (!response.output || response.output.length === 0) {
          return ['Puxa, me distraí aqui... pode repetir?'];
        }

        return response.output;
      } catch (error: any) {
        attempts++;
        const isRateLimit = error?.message?.includes('429') || error?.message?.toLowerCase().includes('exhausted');
        
        if (isRateLimit && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, attempts * 2000));
          continue;
        }
        
        if (isRateLimit) {
          return ["Puxa, estou recebendo muitas mensagens agora! Pode esperar um minutinho e tentar de novo?"];
        }
        throw error;
      }
    }
    return ["Tive um probleminha técnico aqui. Vamos tentar de novo?"];
  }
);
