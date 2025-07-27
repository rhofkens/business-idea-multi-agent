import { loggingService } from '../services/logging-service.js';
import { BusinessPreferences } from '@business-idea/shared';
import type { WorkflowEvent } from '@business-idea/shared';
import { WebSocketSessionManager } from '../services/websocket-session-manager.js';
import { WebSocketCacheEmitter } from '../services/websocket-cache-emitter.js';

// Import step functions
import { runIdeationStep } from './steps/ideation-step.js';
import { runCompetitorStep } from './steps/competitor-step.js';
import { runCriticStep } from './steps/critic-step.js';
import { runDocumentationStep } from './steps/documentation-step.js';

// Import types
import type { StepContext } from './types/orchestrator-types.js';

/**
 * Orchestrates the sequential execution of the agent chain.
 */
export class AgentOrchestrator {
  private wsManager = WebSocketSessionManager.getInstance();
  private sessionId?: string;
  private cacheEmitter: WebSocketCacheEmitter;

  constructor() {
    this.cacheEmitter = new WebSocketCacheEmitter(
      (type, agentName, message, level, metadata) =>
        this.emitEvent(type, agentName, message, level, metadata)
    );
  }

  /**
   * Helper method to emit a workflow event
   */
  private emitEvent(
    type: WorkflowEvent['type'],
    agentName: string,
    message: string,
    level: WorkflowEvent['level'] = 'info',
    metadata?: WorkflowEvent['metadata']
  ): void {
    // Always broadcast events, regardless of sessionId
    // The WebSocketSessionManager will handle routing to appropriate sessions
    const event: WorkflowEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      agentName,
      level,
      message,
      metadata
    };

    this.wsManager.broadcastWorkflowEvent(event);
  }

  /**
   * Runs the full agent chain, from ideation to documentation.
   * @param preferences The business preferences provided by the user
   * @param useTestCache Whether to use test cache for development
   * @returns A promise that resolves to a success message.
   */
  public async runChain(preferences: BusinessPreferences, useTestCache = false, sessionId?: string): Promise<string> {
    this.sessionId = sessionId;

    try {
      // Create the step context to be shared across all steps
      const context: StepContext = {
        sessionId: this.sessionId,
        wsManager: this.wsManager,
        cacheEmitter: this.cacheEmitter,
        emitEvent: this.emitEvent.bind(this),
        useTestCache
      };

      // Step 1: Run Ideation Agent
      const ideationResult = await runIdeationStep({
        context,
        input: { preferences }
      });

      // Step 2: Run Competitor Analysis Agent
      const competitorResult = await runCompetitorStep({
        context,
        input: { refinedIdeas: ideationResult.refinedIdeas }
      });

      // Step 3: Run Business Critic Agent
      const criticResult = await runCriticStep({
        context,
        input: { enrichedIdeas: competitorResult.enrichedIdeas }
      });

      // Step 4: Run Documentation Agent
      await runDocumentationStep({
        context,
        input: { criticallyEvaluatedIdeas: criticResult.criticallyEvaluatedIdeas }
      });

      this.emitEvent('status', 'Orchestrator', '✅ Agent chain completed successfully!');
      
      return 'Agent chain completed successfully.';
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      loggingService.log({
        level: 'ERROR',
        message: 'Agent chain execution failed.',
        details: errorMessage,
      });
      
      this.emitEvent(
        'error',
        'Orchestrator',
        `❌ Agent chain execution failed: ${errorMessage}`,
        'error'
      );
      
      throw new Error(`Execution failed: ${errorMessage}`);
    }
  }
}