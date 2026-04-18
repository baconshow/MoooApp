
import { config } from 'dotenv';
config();

import '@/ai/flows/daily-quote-generator.ts';
import '@/ai/flows/kook-genkit-agent.ts';
import '@/ai/flows/food-analyzer-flow.ts';
import '@/ai/flows/meal-suggester-flow.ts';
import '@/ai/tools/get-user-data.ts';
