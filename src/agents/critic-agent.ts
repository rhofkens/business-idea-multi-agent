import { Agent } from '@openai/agents';

export const criticAgent = new Agent({
  name: 'Business Critic Agent',
  instructions: 'You are the Business Critic Agent. Acknowledge this and wait for the next instruction.',
  model: 'gpt-4o',
});