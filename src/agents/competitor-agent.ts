import { Agent } from '@openai/agents';

export const competitorAgent = new Agent({
  name: 'Competitor Analysis Agent',
  instructions: 'You are the Competitor Analysis Agent. Acknowledge this and wait for the next instruction.',
  model: 'gpt-4o',
});