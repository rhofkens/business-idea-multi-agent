import { Agent } from '@openai/agents';

export const documentationAgent = new Agent({
  name: 'Documentation Agent',
  instructions: 'You are the Documentation Agent. Acknowledge this and report that the process is complete.',
  model: 'gpt-4o',
});