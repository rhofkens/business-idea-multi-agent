import type { BusinessIdea, BusinessPreferences, WorkflowEvent } from '@business-idea/shared';
import type { WebSocketSessionManager } from '../../services/websocket-session-manager.js';
import type { WebSocketCacheEmitter } from '../../services/websocket-cache-emitter.js';
import type { DocumentationAgentOutput } from '../../types/agent-types.js';

/**
 * Context passed to each orchestrator step
 */
export interface StepContext {
  sessionId?: string;
  wsManager: WebSocketSessionManager;
  cacheEmitter: WebSocketCacheEmitter;
  emitEvent: (
    type: WorkflowEvent['type'],
    agentName: string,
    message: string,
    level?: WorkflowEvent['level'],
    metadata?: WorkflowEvent['metadata']
  ) => void;
  useTestCache: boolean;
}

/**
 * Result from the ideation step
 */
export interface IdeationStepResult {
  refinedIdeas: BusinessIdea[];
  ideaCount: number;
  refinedIdeaCount: number;
}

/**
 * Result from the competitor analysis step
 */
export interface CompetitorStepResult {
  enrichedIdeas: BusinessIdea[];
  competitorCount: number;
}

/**
 * Result from the critic evaluation step
 */
export interface CriticStepResult {
  criticallyEvaluatedIdeas: BusinessIdea[];
  criticalCount: number;
}

/**
 * Result from the documentation step
 */
export interface DocumentationStepResult {
  documentationResult: DocumentationAgentOutput | null;
}

/**
 * Common parameters for all step functions
 */
export interface StepParams<T = unknown> {
  context: StepContext;
  input: T;
}

/**
 * Ideation step input
 */
export interface IdeationStepInput {
  preferences: BusinessPreferences;
}

/**
 * Competitor step input
 */
export interface CompetitorStepInput {
  refinedIdeas: BusinessIdea[];
}

/**
 * Critic step input
 */
export interface CriticStepInput {
  enrichedIdeas: BusinessIdea[];
}

/**
 * Documentation step input
 */
export interface DocumentationStepInput {
  criticallyEvaluatedIdeas: BusinessIdea[];
}