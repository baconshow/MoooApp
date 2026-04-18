'use server';

/**
 * @fileOverview An AI flow to suggest meals based on recent history and user goals.
 *
 * - suggestMeals - A function that takes recent meal logs and returns a list of suggestions.
 * - MealSuggestionOutput - The return type for the meal suggestion.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { FoodLog } from '@/hooks/use-daily-log';

const MealSuggestionInputSchema = z.object({
  recentMeals: z.array(z.object({
      dishName: z.string(),
      calories: z.number(),
      protein: z.number(),
      carbohydrates: z.number(),
      fat: z.number(),
    })).describe("A list of the user's recently consumed meals, with their nutritional info."),
  goal: z.string().optional().describe("The user's current goal, e.g., 'emagrecimento', 'manutenção', 'ganho de massa'."),
  aiName: z.string().optional().describe("The name of the AI assistant."),
  userNickname: z.string().optional().describe("The user's nickname."),
});

const SuggestedMealSchema = z.object({
    dishName: z.string().describe("The name of a creative and appealing meal dish, in Portuguese (Brazil)."),
    calories: z.number().describe("Estimated calories for the suggested dish."),
    macros: z.object({
        protein: z.number().describe("Grams of protein."),
        carbohydrates: z.number().describe("Grams of carbohydrates."),
        fat: z.number().describe("Grams of fat."),
        fiber: z.number().describe("Grams of fiber."),
        sugar: z.number().describe("Grams of sugar."),
    }),
    healthScore: z.number().min(1).max(10).describe("A health score from 1 to 10."),
    creativeReasoning: z.string().describe("A very short, creative, and appealing reason why this dish is a good suggestion. Speak in Portuguese (Brazil)."),
    ingredients: z.array(z.object({
        name: z.string().describe("The name of the ingredient."),
        quantity: z.string().describe("The quantity and unit of the ingredient (e.g., '100g', '2 unidades', 'a gosto').")
    })).describe("A complete and professional list of ingredients for the recipe, including quantities."),
    preparation: z.string().describe("A concise, step-by-step professional preparation guide for the recipe."),
    preparationTime: z.string().describe("The estimated preparation time, for example: 'Aprox. 30 minutos'."),
});
export type SuggestedMeal = z.infer<typeof SuggestedMealSchema>;

const MealSuggestionOutputSchema = z.object({
    naturalObservation: z.string().describe("A brief, friendly, and very natural observation about the user's recent eating patterns, in a caring and masculine tone. You MUST mention one or two specific dishes from their log. For example: 'Ei, [userNickname], notei que você mandou ver no Strogonoff e na Pizza! Delicioso, mas que tal uma opção mais leve agora?'. Speak in Portuguese (Brazil)."),
    suggestions: z.array(SuggestedMealSchema).length(3).describe("A list of exactly 3 creative and appealing meal suggestions based on the observation and goal."),
});

export type MealSuggestionOutput = z.infer<typeof MealSuggestionOutputSchema>;

export async function suggestMeals(recentMeals: FoodLog[], userNickname?: string, aiName?: string, goal?: string): Promise<MealSuggestionOutput> {
    const simplifiedMeals = recentMeals.map(m => ({
        dishName: m.dishName || 'Prato não identificado',
        calories: m.calories || 0,
        protein: m.protein || 0,
        carbohydrates: m.carbohydrates || 0,
        fat: m.fat || 0,
    }));
    
  return mealSuggesterFlow({ recentMeals: simplifiedMeals, goal, userNickname, aiName });
}

const mealSuggesterPrompt = ai.definePrompt({
  name: 'mealSuggesterPrompt',
  input: { schema: MealSuggestionInputSchema },
  output: { schema: MealSuggestionOutputSchema },
  prompt: `You are a friendly, creative, and caring nutritional assistant named {{aiName}}. Your personality is masculine, supportive, and a bit playful.
You are talking to a user whose nickname is {{userNickname}}. Your entire response MUST be in Portuguese (Brazil).

Your task is to analyze their recent meals and current goal to provide helpful and appealing meal suggestions.

1.  **Analyze Recent Meals**: Look at the list of recent meals:
    {{#each recentMeals}}
    - {{dishName}} ({{calories}} kcal, P:{{protein}}g, C:{{carbohydrates}}g, F:{{fat}}g)
    {{/each}}

2.  **User Goal**: Their current goal is '{{goal}}'. If no goal is provided, assume 'manutenção' (maintenance).

3.  **Generate a Natural Observation**: Based on the meals, make a short, caring, and non-judgmental observation. Address the user by their nickname. CRITICALLY IMPORTANT: You MUST mention one or two specific dishes from their log to show you are paying attention. For example: 'Notei que você comeu Strogonoff e Pizza...'. Don't just list macros. Be conversational.

4.  **Generate THREE Suggestions**: Based on your observation and their goal, generate THREE distinct, creative, and appealing meal suggestions. For EACH suggestion, you must provide a COMPLETE AND PROFESSIONAL recipe, including:
    - dishName (in Portuguese)
    - calories (estimated)
    - macros (protein, carbohydrates, fat, fiber, sugar)
    - healthScore (1-10)
    - creativeReasoning (a short, fun justification)
    - ingredients (a complete list with names and quantities, e.g., "100g de frango", "2 ovos")
    - preparation (a simple, professional step-by-step guide)
    - preparationTime (an estimated time, e.g., "Aprox. 45 minutos")
    
    - If their goal is 'emagrecimento', suggest lighter, high-protein/fiber options.
    - If 'ganho de massa', suggest balanced meals with higher protein and complex carbs.
    - If 'manutenção', suggest varied and balanced meals.
    - Be creative! Don't suggest boring dishes.

Your entire response must be in the structured JSON format, with a list of exactly 3 suggestions.`,
});

const mealSuggesterFlow = ai.defineFlow(
  {
    name: 'mealSuggesterFlow',
    inputSchema: MealSuggestionInputSchema,
    outputSchema: MealSuggestionOutputSchema,
  },
  async (input) => {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const { output } = await mealSuggesterPrompt({
            ...input,
            aiName: input.aiName || 'Kook',
            userNickname: input.userNickname || 'Chef',
        });
        if (!output || !output.suggestions || output.suggestions.length < 3) {
          throw new Error('Failed to get valid suggestions from the AI model.');
        }
        return output;
      } catch (error: any) {
        attempts++;
        const isRateLimit = error?.message?.includes('429') || error?.message?.toLowerCase().includes('exhausted');
        
        if (isRateLimit && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, attempts * 2000));
          continue;
        }
        
        if (isRateLimit) {
          throw new Error('Muitas requisições ao mesmo tempo. Aguarde um momento e peça as ideias novamente.');
        }
        throw error;
      }
    }
    throw new Error('Falha ao gerar sugestões.');
  }
);
