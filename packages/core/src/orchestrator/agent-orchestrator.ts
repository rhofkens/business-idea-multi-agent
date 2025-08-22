import { loggingService } from '../services/logging-service.js';
import { BusinessPreferences } from '@business-idea/shared';
import type { WorkflowEvent } from '@business-idea/shared';
import { WebSocketSessionManager } from '../services/websocket-session-manager.js';
import { WebSocketCacheEmitter } from '../services/websocket-cache-emitter.js';
import { runRepository } from '../data/repositories/run-repository.js';
import { ExecutionModeRegistry } from '../execution-modes/registry/ExecutionModeRegistry.js';
import { SolopreneurModeFactory } from '../execution-modes/solopreneur/SolopreneurModeFactory.js';
import { ClassicStartupModeFactory } from '../execution-modes/classic-startup/ClassicStartupModeFactory.js';
import { ExecutionModeFactory } from '../execution-modes/base/ExecutionModeFactory.js';

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
  private registry: ExecutionModeRegistry;

  constructor() {
    this.cacheEmitter = new WebSocketCacheEmitter(
      (type, agentName, message, level, metadata) =>
        this.emitEvent(type, agentName, message, level, metadata)
    );
    
    // Initialize the execution mode registry
    this.registry = new ExecutionModeRegistry();
    this.registry.register(new SolopreneurModeFactory());
    this.registry.register(new ClassicStartupModeFactory());
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
   * @param sessionId Optional session ID for WebSocket communication
   * @param userId User ID for database persistence
   * @returns A promise that resolves to a success message.
   */
  public async runChain(preferences: BusinessPreferences, useTestCache = false, sessionId?: string, userId?: string): Promise<string> {
    this.sessionId = sessionId;

    try {
      // Create a run in the database if userId is provided
      let runId: string | undefined;
      if (userId) {
        const run = await runRepository.createRun(userId, preferences);
        runId = run.id;
        
        this.emitEvent('status', 'Orchestrator', `Created run ${runId} for user ${userId}`);
      }

      // Get the execution mode factory
      const executionMode = preferences.executionMode || 'classic-startup';
      let factory: ExecutionModeFactory;
      
      // Try to get exact match first, otherwise map to closest factory
      try {
        factory = this.registry.getFactory(executionMode);
      } catch {
        // Map descriptive execution modes to our registered factories
        const lowerMode = executionMode.toLowerCase();
        if (lowerMode.includes('solo') || lowerMode.includes('1-') || lowerMode.includes('2-') || lowerMode.includes('3-')) {
          factory = this.registry.getFactory('solopreneur');
          this.emitEvent('status', 'Orchestrator', `Mapped execution mode "${executionMode}" to solopreneur factory`);
        } else {
          factory = this.registry.getFactory('classic-startup');
          this.emitEvent('status', 'Orchestrator', `Mapped execution mode "${executionMode}" to classic-startup factory`);
        }
      }
      
      this.emitEvent('status', 'Orchestrator', `Using execution mode: ${executionMode}`);
      
      // Create the step context to be shared across all steps
      const context: StepContext = {
        sessionId: this.sessionId,
        runId,
        userId,
        wsManager: this.wsManager,
        cacheEmitter: this.cacheEmitter,
        emitEvent: this.emitEvent.bind(this),
        useTestCache,
        factory
      };

      // Step 1: Run Ideation Agent with factory
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