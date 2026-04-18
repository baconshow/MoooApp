
import {genkit, GenkitPlugin} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Always initialize the Google AI plugin.
// The API key should be configured in the environment.
const plugins: GenkitPlugin[] = [googleAI()];

export const ai = genkit({
  plugins,
  model: 'googleai/gemini-2.0-flash',
});
