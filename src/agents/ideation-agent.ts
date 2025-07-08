import { Agent } from '@openai/agents';

export const ideationAgent = new Agent({
  name: 'Ideation Agent',
  instructions: 'You are the Ideation Agent. Acknowledge this and wait for the next instruction.',
  model: 'gpt-4o',
});