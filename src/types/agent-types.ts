import { z } from 'zod';
import { BusinessIdea } from './business-idea.js';

export const businessIdeaSchema = z.object({
  title: z.string(),
  description: z.string(),
  businessModel: z.enum(['B2B', 'B2C', 'B2B2C', 'Marketplace', 'SaaS', 'DTC']),
  disruptionPotential: z.number().min(1).max(10),
  marketPotential: z.number().min(1).max(10),
  technicalComplexity: z.number().min(1).max(10),
  capitalIntensity: z.number().min(1).max(10),
  blueOceanScore: z.number().min(1).max(10).optional(),
  overallScore: z.number().min(1).max(10).optional(),
  reasoning: z.object({
    disruption: z.string(),
    market: z.string(),
    technical: z.string(),
    capital: z.string(),
    blueOcean: z.string().optional(),
    overall: z.string().optional(),
  }),
  competitorAnalysis: z.string().optional(),
  criticalAnalysis: z.string().optional(),
});

/**
 * Defines the output structure for the Ideation Agent.
 */
export type IdeationAgentOutput = z.infer<typeof ideationAgentOutputSchema>;

/**
 * Zod schema for validating the output of the Ideation Agent.
 * Ensures the data structure conforms to the expected format.
 * @see {@link IdeationAgentOutput}
 */
export const ideationAgentOutputSchema = z.array(businessIdeaSchema);

/**
 * Defines the output structure for the Competitor Agent.
 */
export type CompetitorAgentOutput = BusinessIdea[];

/**
 * Defines the output structure for the Business Critic Agent.
 */
export type CriticAgentOutput = BusinessIdea[];

/**
 * Defines the output structure for the Documentation Agent.
 */
export interface DocumentationAgentOutput {
  /** The path where the report was saved */
  reportPath: string;
  /** Total execution time in milliseconds */
  processingTime: number;
  /** Number of ideas in the report */
  ideasProcessed: number;
}

/**
 * Defines the events that can be yielded by a streaming agent.
 */
export type StreamEvent =
  | { type: 'chunk'; data: string }
  | { type: 'idea'; data: BusinessIdea }
  | { type: 'refined-idea'; data: BusinessIdea }
  | { type: 'status'; data: string }
  | { type: 'complete' };