import { z } from 'zod';
import { businessIdeaSchema } from '@business-idea/shared';

/**
 * Input schema for the Documentation Agent.
 * Expects an array of fully-analyzed BusinessIdea objects that have been
 * processed through all previous agents (Ideation, Competitor, Critic).
 */
export const DocumentationAgentInputSchema = z.object({
  ideas: z.array(businessIdeaSchema).min(1).describe('Array of fully-analyzed business ideas'),
});

/**
 * Type representing the validated input for the Documentation Agent
 */
export type DocumentationAgentInput = z.infer<typeof DocumentationAgentInputSchema>;

/**
 * Event types emitted by the Documentation Agent during processing
 */
export type DocumentationStreamEvent =
  | { type: 'status'; data: string }
  | { type: 'chunk'; data: string }
  | { type: 'idea-processed'; data: { title: string; index: number; total: number } }
  | { type: 'section-generated'; data: { section: string; content: string } }
  | { type: 'complete' };