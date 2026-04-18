'use server';

/**
 * @fileOverview An AI flow to analyze a food image and return nutritional information + vitality classification.
 *
 * - analyzeFoodImage - A function that takes an image and returns a nutritional analysis.
 * - FoodAnalysisOutput - The return type for the food analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const FoodAnalysisInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a meal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  aiName: z.string().optional().describe("The name of the AI assistant."),
  userNickname: z.string().optional().describe("The user's nickname."),
});

// FLATTENED SCHEMA to avoid nested objects in Firestore arrays
const FoodAnalysisOutputSchema = z.object({
  dishName: z.string().describe('The name of the dish identified in the image, in Portuguese (Brazil).'),
  calories: z.number().describe('An estimated calorie count for the meal.'),
  protein: z.number().describe('Estimated grams of protein.'),
  carbohydrates: z.number().describe('Estimated grams of carbohydrates.'),
  fat: z.number().describe('Estimated grams of fat.'),
  fiber: z.number().optional().describe('Estimated grams of fiber.'),
  sugar: z.number().optional().describe('Estimated grams of sugar.'),
  healthScore: z.number().min(1).max(10).describe('A health score from 1 (unhealthy) to 10 (very healthy).'),
  vitalityClass: z.enum(['biogenic', 'bioactive', 'biostatic', 'biocidic']).describe('A vitalidade predominante do alimento.'),
  analysisText: z.string().describe('A brief, friendly, and creative analysis of the meal in one or two sentences. Speak in Portuguese (Brazil).'),
});

export type FoodAnalysisOutput = z.infer<typeof FoodAnalysisOutputSchema>;

export async function analyzeFoodImage(photoDataUri: string, userNickname?: string, aiName?: string): Promise<FoodAnalysisOutput> {
  return foodAnalysisFlow({ photoDataUri, userNickname, aiName });
}

const foodAnalysisPrompt = ai.definePrompt({
  name: 'foodAnalysisPrompt',
  input: { schema: FoodAnalysisInputSchema },
  output: { schema: FoodAnalysisOutputSchema },
  prompt: `You are a friendly and creative nutritional assistant named {{aiName}}. Your personality is masculine, supportive, and a bit playful.
The user's nickname is {{userNickname}}.
Analyze the meal in the provided image. Your entire response MUST be in Portuguese (Brazil).

Your task is to:
1.  Identify the dish and respond with the 'dishName' in Portuguese (Brazil).
2.  Provide a realistic estimate for the calories, protein, carbohydrates, fat, fiber, and sugar.
3.  Give a health score from 1 to 10.
4.  Classifique a vitalidade predominante do prato no campo "vitalityClass" usando EXATAMENTE um destes valores:
    - "biogenic": brotos, germinados, sementes ativadas (GERAM vida)
    - "bioactive": frutas frescas maduras cruas, hortaliças cruas, nozes cruas (ATIVAM vida)
    - "biostatic": alimentos cozidos, refrigerados, estocados (MANTÊM vida no mínimo)
    - "biocidic": ultraprocessados, refinados, com conservantes (DESTROEM vida)

    Regras de classificação:
    - Prato com mistura de categorias: escolha a PREDOMINANTE (o que ocupa mais volume no prato)
    - Salada crua fresca = bioactive
    - Arroz + feijão cozido = biostatic  
    - Fast food / salgadinhos / refrigerante = biocidic
    - Brotos / germinados = biogenic
5.  Write a short, creative, and supportive analysis of the meal in the 'analysisText' field, in Portuguese (Brazil). Keep it positive and encouraging. Address the user by their nickname, {{userNickname}}.

IMPORTANT: The 'dishName' field MUST be in Portuguese (Brazil). The output MUST be a flat JSON object, do NOT nest macros inside another object.

Analyze this image: {{media url=photoDataUri}}`,
});

const foodAnalysisFlow = ai.defineFlow(
  {
    name: 'foodAnalysisFlow',
    inputSchema: FoodAnalysisInputSchema,
    outputSchema: FoodAnalysisOutputSchema,
  },
  async (input) => {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const { output } = await foodAnalysisPrompt({
            ...input,
            aiName: input.aiName || 'Kook',
            userNickname: input.userNickname || 'Chef',
        });
        if (!output) {
          throw new Error('Failed to get a valid analysis from the AI model.');
        }
        return output;
      } catch (error: any) {
        attempts++;
        const isRateLimit = error?.message?.includes('429') || error?.message?.toLowerCase().includes('exhausted');
        
        if (isRateLimit && attempts < maxAttempts) {
          // Exponential backoff: 2s, 4s
          await new Promise(resolve => setTimeout(resolve, attempts * 2000));
          continue;
        }
        
        if (isRateLimit) {
          throw new Error('O sistema de IA está um pouco sobrecarregado agora. Por favor, tente novamente em um minuto.');
        }
        throw error;
      }
    }
    throw new Error('Falha inesperada ao conectar com a IA.');
  }
);
