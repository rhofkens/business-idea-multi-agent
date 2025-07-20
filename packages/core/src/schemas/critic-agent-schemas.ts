import { z } from 'zod';
import { businessIdeaSchema } from '@business-idea/shared';

/**
 * Input schema for the Business Critic Agent.
 * Receives an array of business ideas with competitor analysis from the Competitor Agent.
 */
export const CriticAgentInputSchema = z.object({
  businessIdeas: z.array(businessIdeaSchema),
});

/**
 * Output schema for the Business Critic Agent.
 * Returns fully analyzed business ideas with critical analysis and Overall Scores.
 */
export const CriticAgentOutputSchema = z.array(
  businessIdeaSchema.extend({
    criticalAnalysis: z.string().describe('Critical evaluation and risk assessment based on web search'),
    overallScore: z.number().min(0).max(10).describe('Final overall score calculated according to ADR-005'),
    reasoning: businessIdeaSchema.shape.reasoning.extend({
      overall: z.string().describe('Comprehensive reasoning for the overall score, including risk factors'),
    }),
  }),
);

export type CriticAgentInput = z.infer<typeof CriticAgentInputSchema>;
export type CriticAgentOutput = z.infer<typeof CriticAgentOutputSchema>;

/**
 * Extended stream events for the Business Critic Agent.
 * Includes the specific 'critical-analysis' event type.
 */
export type CriticStreamEvent =
  | { type: 'chunk'; data: string }
  | { type: 'status'; data: string }
  | { type: 'critical-analysis'; data: { ideaTitle: string; analysis: string; overallScore: number } }
  | { type: 'complete' };