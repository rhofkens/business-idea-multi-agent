/**
 * Utility functions for transforming business ideas between backend and frontend formats.
 * Maps backend `businessIdeaSchema` to frontend `BusinessIdea` interface.
 */

import { z } from 'zod';
import { businessIdeaSchema } from '@business-idea/shared';
import type { WorkflowEvent } from '@business-idea/shared';
import type { BusinessIdea } from '@/types/business-idea';

// Infer the TypeScript type from the Zod schema
type BusinessIdeaSchema = z.infer<typeof businessIdeaSchema>;

/**
 * Maps a single business idea from backend schema to frontend format.
 *
 * This function transforms the backend Zod schema structure into the frontend-specific
 * BusinessIdea interface, performing the following transformations:
 * - Generates a numeric ID based on the provided index
 * - Maps individual score fields to a nested scores object
 * - Consolidates reasoning fields into a single reasoning object
 * - Adds UI-specific fields like starred status and timestamps
 * - Sets default values for fields not available in the backend schema
 *
 * @param backendIdea - Business idea in backend schema format (Zod-validated)
 * @param index - Zero-based index used to generate a numeric ID (will be incremented by 1)
 * @param isCurrentRun - Whether this idea is from the current generation run (default: true)
 * @returns Business idea transformed for frontend consumption with all required UI fields
 *
 * @example
 * ```typescript
 * const backendData = {
 *   title: "AI-Powered Learning Platform",
 *   description: "Revolutionary education platform",
 *   disruptionPotential: 85,
 *   marketPotential: 78,
 *   // ... other fields
 * };
 *
 * const frontendIdea = transformBusinessIdea(backendData, 0, true);
 * // Returns: {
 * //   id: 1,
 * //   name: "AI-Powered Learning Platform",
 * //   scores: { disruption: 85, market: 78, ... },
 * //   starred: false,
 * //   isCurrentRun: true,
 * //   ...
 * // }
 * ```
 */
export function transformBusinessIdea(
  backendIdea: BusinessIdeaSchema,
  index: number,
  isCurrentRun: boolean = true
): BusinessIdea {
  return {
    // Use the ULID from the backend
    id: backendIdea.id,
    
    // Default to not starred (can be managed by UI state)
    starred: false,
    
    // Direct field mappings
    title: backendIdea.title,
    name: backendIdea.title, // Using title as name since backend doesn't have separate name field
    description: backendIdea.description,
    businessModel: backendIdea.businessModel,
    executionMode: backendIdea.executionMode,
    
    // Map individual score fields to nested scores object
    scores: {
      overall: backendIdea.overallScore ?? null,
      disruption: backendIdea.disruptionPotential,
      market: backendIdea.marketPotential,
      technical: backendIdea.technicalComplexity,
      capital: backendIdea.capitalIntensity,
      blueOcean: backendIdea.blueOceanScore ?? null,
    },
    
    // Map reasoning fields
    reasoning: {
      overall: backendIdea.reasoning.overall || '',
      disruption: backendIdea.reasoning.disruption || '',
      market: backendIdea.reasoning.market || '',
      technical: backendIdea.reasoning.technical || '',
      capital: backendIdea.reasoning.capital || '',
      blueOcean: backendIdea.reasoning.blueOcean || '',
    },
    
    // Fields not available in backend schema - set to null or default
    competitorAnalysis: null,
    criticalAnalysis: null,
    reportPath: null,
    
    // Set timestamp to current time
    lastUpdated: new Date().toISOString(),
    
    // Track if from current run
    isCurrentRun,
  };
}

/**
 * Extracts business ideas from workflow events and transforms them to frontend format.
 *
 * This function processes an array of workflow events from the WebSocket stream,
 * looking for business idea data in the event metadata. It handles multiple patterns:
 * - Multiple ideas in `metadata.data.businessIdeas` (array)
 * - Single idea in `metadata.data.businessIdea` (object)
 * - Single idea in `metadata.data.idea` (from IdeationAgent)
 * - Single idea in `metadata.data.refinedIdea` (from IdeationAgent)
 *
 * Each extracted idea is transformed using `transformBusinessIdea()` with an
 * incrementing index to ensure unique IDs.
 *
 * @param events - Array of workflow events from the WebSocket stream
 * @param isCurrentRun - Whether these events are from the current generation run (default: true)
 * @returns Array of transformed business ideas ready for frontend display
 *
 * @example
 * ```typescript
 * const events = [
 *   {
 *     type: 'result',
 *     metadata: {
 *       data: {
 *         businessIdeas: [
 *           { title: "Idea 1", ... },
 *           { title: "Idea 2", ... }
 *         ]
 *       }
 *     }
 *   }
 * ];
 *
 * const ideas = extractBusinessIdeasFromEvents(events, true);
 * // Returns array of 2 transformed BusinessIdea objects
 * ```
 */
export function extractBusinessIdeasFromEvents(
  events: WorkflowEvent[],
  isCurrentRun: boolean = true
): BusinessIdea[] {
  const ideas: BusinessIdea[] = [];
  let ideaIndex = 0;
  
  events.forEach((event) => {
    // Check for ideation results in event metadata.data
    if (event.metadata?.data && typeof event.metadata.data === 'object') {
      const data = event.metadata.data as {
        businessIdeas?: unknown[];
        businessIdea?: unknown;
        idea?: unknown;
        refinedIdea?: unknown;
      };
      
      // Check for multiple business ideas
      if ('businessIdeas' in data && Array.isArray(data.businessIdeas)) {
        data.businessIdeas.forEach((item) => {
          // Type assertion after checking it's an object
          if (item && typeof item === 'object') {
            const backendIdea = item as BusinessIdeaSchema;
            ideas.push(transformBusinessIdea(backendIdea, ideaIndex, isCurrentRun));
            ideaIndex++;
          }
        });
      }
      
      // Check for single business idea
      if ('businessIdea' in data && data.businessIdea && typeof data.businessIdea === 'object') {
        const backendIdea = data.businessIdea as BusinessIdeaSchema;
        ideas.push(transformBusinessIdea(backendIdea, ideaIndex, isCurrentRun));
        ideaIndex++;
      }
      
      // Check for idea (from IdeationAgent cache)
      if ('idea' in data && data.idea && typeof data.idea === 'object') {
        const backendIdea = data.idea as BusinessIdeaSchema;
        ideas.push(transformBusinessIdea(backendIdea, ideaIndex, isCurrentRun));
        ideaIndex++;
      }
      
      // Check for refinedIdea (from IdeationAgent cache)
      if ('refinedIdea' in data && data.refinedIdea && typeof data.refinedIdea === 'object') {
        const backendIdea = data.refinedIdea as BusinessIdeaSchema;
        ideas.push(transformBusinessIdea(backendIdea, ideaIndex, isCurrentRun));
        ideaIndex++;
      }
    }
  });
  
  return ideas;
}

/**
 * Updates an existing business idea with new data from workflow events.
 *
 * This function performs a shallow merge of the existing idea with the provided
 * updates, automatically updating the `lastUpdated` timestamp to reflect the
 * modification time. Useful for applying partial updates from real-time WebSocket
 * events without losing existing data.
 *
 * @param existingIdea - The current business idea object to update
 * @param updates - Partial updates to apply (only fields to change need to be provided)
 * @returns A new BusinessIdea object with the updates applied and timestamp refreshed
 *
 * @example
 * ```typescript
 * const existingIdea = {
 *   id: 1,
 *   name: "Original Name",
 *   scores: { disruption: 75, market: 80, ... },
 *   // ... other fields
 * };
 *
 * const updatedIdea = updateBusinessIdea(existingIdea, {
 *   scores: { ...existingIdea.scores, disruption: 85 },
 *   criticalAnalysis: "New critical analysis..."
 * });
 * // Returns idea with updated disruption score and critical analysis
 * ```
 */
export function updateBusinessIdea(
  existingIdea: BusinessIdea,
  updates: Partial<BusinessIdea>
): BusinessIdea {
  return {
    ...existingIdea,
    ...updates,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Filters business ideas based on current run status.
 *
 * This utility function filters the provided array of business ideas based on their
 * `isCurrentRun` flag. It's used by the SmartTable component to toggle between
 * showing only ideas from the current generation run or all historical ideas.
 *
 * @param ideas - Array of business ideas to filter
 * @param showCurrentRun - If true, returns only ideas where isCurrentRun is true;
 *                         if false, returns all ideas regardless of run status
 * @returns Filtered array of business ideas matching the criteria
 *
 * @example
 * ```typescript
 * const allIdeas = [
 *   { id: 1, name: "Current Idea", isCurrentRun: true, ... },
 *   { id: 2, name: "Old Idea", isCurrentRun: false, ... },
 *   { id: 3, name: "Another Current", isCurrentRun: true, ... }
 * ];
 *
 * const currentOnly = filterBusinessIdeas(allIdeas, true);
 * // Returns: [
 * //   { id: 1, name: "Current Idea", isCurrentRun: true, ... },
 * //   { id: 3, name: "Another Current", isCurrentRun: true, ... }
 * // ]
 * ```
 */
export function filterBusinessIdeas(
  ideas: BusinessIdea[],
  showCurrentRun: boolean
): BusinessIdea[] {
  return ideas.filter((idea) => idea.isCurrentRun === showCurrentRun);
}