'use server';

/**
 * @fileOverview Generates a daily inspiring quote, ensuring no repeats.
 *
 * - generateDailyQuote - A function that returns a daily quote.
 * - DailyQuoteOutput - The return type for the generateDailyQuote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DailyQuoteOutputSchema = z.object({
  quote: z.string().describe('An inspiring quote for the day.'),
});

export type DailyQuoteOutput = z.infer<typeof DailyQuoteOutputSchema>;

const UsedQuotesSchema = z.array(z.string());

const GetNewQuoteTool = ai.defineTool({
  name: 'getNewQuote',
  description: 'Gets a new inspiring quote that has not been used before.',
  inputSchema: z.object({
    usedQuotes: z.array(z.string()).describe('List of quotes that have already been used.')
  }),
  outputSchema: z.string().describe('A new, inspiring quote that has not been used before.')
}, async (input) => {
  // Mock implementation: return a quote that is not in the usedQuotes list.
  const allQuotes = [
    'The only way to do great work is to love what you do. - Steve Jobs',
    'Believe you can and you’re halfway there. - Theodore Roosevelt',
    'The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt',
    'The best way to predict the future is to create it. - Peter Drucker',
    'Do not wait to strike till the iron is hot, but make it hot by striking. - William Butler Yeats',
    'Challenges are what make life interesting and overcoming them is what makes life meaningful. - Joshua Marine'
  ];

  const availableQuotes = allQuotes.filter(quote => !input.usedQuotes.includes(quote));

  if (availableQuotes.length === 0) {
    return 'All quotes have been used. Please reset the used quotes list.';
  }

  return availableQuotes[Math.floor(Math.random() * availableQuotes.length)];
});

const dailyQuotePrompt = ai.definePrompt({
  name: 'dailyQuotePrompt',
  tools: [GetNewQuoteTool],
  input: {
    schema: z.object({
      usedQuotes: UsedQuotesSchema,
    }),
  },
  output: {schema: DailyQuoteOutputSchema},
  prompt: `You are a daily inspiration quote generator.  You are given a list of quotes that have already been used.

  Return a new quote that has not been used before, by using the getNewQuote tool. 
  The used quotes are: {{{usedQuotes}}}`,
});

export async function generateDailyQuote(usedQuotes: string[]): Promise<DailyQuoteOutput> {
  return dailyQuoteFlow({usedQuotes});
}

const dailyQuoteFlow = ai.defineFlow(
  {
    name: 'dailyQuoteFlow',
    inputSchema: z.object({
      usedQuotes: UsedQuotesSchema,
    }),
    outputSchema: DailyQuoteOutputSchema,
  },
  async input => {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const {output} = await dailyQuotePrompt(input);
        return output!;
      } catch (error: any) {
        attempts++;
        const isRateLimit = error?.message?.includes('429') || error?.message?.toLowerCase().includes('exhausted');
        
        if (isRateLimit && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, attempts * 2000));
          continue;
        }
        
        if (isRateLimit) {
          return { quote: "Acredite em você mesma hoje! ✨ (O gerador de frases está descansando um pouco)" };
        }
        throw error;
      }
    }
    return { quote: "Um dia de cada vez. 🌸" };
  }
);
