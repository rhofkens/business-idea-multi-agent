import { z } from 'zod';
import { businessIdeaSchema } from '@business-idea/shared';

/**
 * Input schema for the Competitor Analysis Agent.
 * Receives an array of business ideas from the Ideation Agent.
 */
export const CompetitorAgentInputSchema = z.object({
  businessIdeas: z.array(businessIdeaSchema),
});

/**
 * Output schema for the Competitor Analysis Agent.
 * Returns enriched business ideas with competitor analysis and Blue Ocean scores.
 */
export const CompetitorAgentOutputSchema = z.array(
  businessIdeaSchema.extend({
    competitorAnalysis: z.string().describe('Detailed competitor analysis based on web search results'),
    blueOceanScore: z.number().min(1).max(10).describe('Blue Ocean score calculated according to ADR 003'),
    reasoning: businessIdeaSchema.shape.reasoning.extend({
      blueOcean: z.string().describe('Detailed reasoning for the Blue Ocean score'),
    }),
  }),
);

export type CompetitorAgentInput = z.infer<typeof CompetitorAgentInputSchema>;
export type CompetitorAgentOutput = z.infer<typeof CompetitorAgentOutputSchema>;

/**
 * Extended stream events for the Competitor Analysis Agent.
 * Includes the specific 'competitor-analysis' event type.
 */
export type CompetitorStreamEvent =
  | { type: 'chunk'; data: string }
  | { type: 'status'; data: string }
  | { type: 'competitor-analysis'; data: { ideaTitle: string; analysis: string; blueOceanScore: number } }
  | { type: 'complete' };