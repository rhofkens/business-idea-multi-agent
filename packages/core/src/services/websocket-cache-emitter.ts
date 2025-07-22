import { WorkflowEvent, BusinessIdea } from '@business-idea/shared';
import { DocumentationAgentOutput } from '../types/agent-types.js';

/**
 * Configuration for simulating cached results
 */
export interface CacheSimulationConfig<T> {
  /** Name of the agent */
  agentName: string;
  
  /** Array of cached items to simulate */
  items: T[];
  
  /** Initial status message */
  statusMessage: string;
  
  /** Function to generate progress message for each item */
  progressMessageBuilder: (item: T, index: number, total: number) => string;
  
  /** Function to extract metadata for progress events */
  metadataBuilder?: (item: T, index: number, total: number) => Record<string, unknown>;
  
  /** Min delay in milliseconds (default: 500) */
  minDelay?: number;
  
  /** Max delay in milliseconds (default: 1000) */
  maxDelay?: number;
}

/**
 * Service for simulating WebSocket events when using cached test results.
 * Reduces code duplication across agents by providing a unified way to emit
 * cached results with realistic delays.
 */
export class WebSocketCacheEmitter {
  constructor(
    private emitEvent: (
      type: WorkflowEvent['type'],
      agentName: string,
      message: string,
      level: WorkflowEvent['level'],
      metadata?: WorkflowEvent['metadata']
    ) => void
  ) {}

  /**
   * Simulates emitting cached results with delays to mimic real execution
   */
  async simulateCachedResults<T>(config: CacheSimulationConfig<T>): Promise<void> {
    const {
      agentName,
      items,
      statusMessage,
      progressMessageBuilder,
      metadataBuilder,
      minDelay = 500,
      maxDelay = 1000
    } = config;

    // Emit initial status event
    this.emitEvent('status', agentName, statusMessage, 'info');

    // Simulate processing each item with delays
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Random delay between min and max
      const delay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Build progress message
      const progressMessage = progressMessageBuilder(item, i, items.length);
      
      // Build metadata if provided
      const metadata: WorkflowEvent['metadata'] = {
        progress: Math.round(((i + 1) / items.length) * 100),
        ...(metadataBuilder ? metadataBuilder(item, i, items.length) : {})
      };
      
      // Emit progress event
      this.emitEvent('progress', agentName, progressMessage, 'info', metadata);
    }
  }

  /**
   * Helper method specifically for IdeationAgent cached results
   * Emits both initial and refined idea events, matching the original implementation
   */
  async simulateIdeationAgentCache(ideas: BusinessIdea[], agentName: string = 'IdeationAgent'): Promise<void> {
    // Emit initial status
    this.emitEvent('status', agentName, '📦 Loading cached ideas...', 'info');
    
    // Process each idea with delays
    for (let i = 0; i < ideas.length; i++) {
      const idea = ideas[i];
      
      // Random delay between 500ms and 1000ms
      const delay = Math.floor(Math.random() * 500) + 500;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Emit initial idea event
      this.emitEvent(
        'result',
        agentName,
        `💡 Idea ${i + 1}: ${idea.title}`,
        'info',
        {
          data: {
            ideaId: idea.id,
            ideaCount: i + 1,
            idea: idea
          }
        }
      );
      
      // Emit refined idea event
      this.emitEvent(
        'result',
        agentName,
        `🌟 Refined Idea ${i + 1}: ${idea.title}`,
        'info',
        {
          data: {
            ideaId: idea.id,
            refinedIdeaCount: i + 1,
            refinedIdea: idea
          }
        }
      );
    }
    
    // Emit completion event
    this.emitEvent(
      'status',
      agentName,
      `✅ Loaded ${ideas.length} cached ideas!`,
      'info',
      {
        data: {
          ideaCount: ideas.length,
          refinedIdeaCount: ideas.length
        }
      }
    );
  }

  /**
   * Helper method specifically for CompetitorAgent cached results
   */
  async simulateCompetitorAgentCache(ideas: BusinessIdea[], agentName: string = 'CompetitorAgent'): Promise<void> {
    await this.simulateCachedResults({
      agentName,
      items: ideas,
      statusMessage: '📦 Loading cached competitor analysis...',
      progressMessageBuilder: (idea, index, total) => 
        `🎯 Analyzing idea ${index + 1}/${total}: ${idea.title}`,
      metadataBuilder: (idea, index, total) => ({
        stage: 'competitor-analysis',
        data: {
          ideaId: idea.id,
          competitorCount: index + 1,
          totalIdeas: total,
          analysis: {
            ideaId: idea.id,
            ideaTitle: idea.title,
            blueOceanScore: idea.blueOceanScore,
            analysis: idea.competitorAnalysis || ''
          }
        }
      })
    });
  }

  /**
   * Helper method specifically for CriticAgent cached results
   */
  async simulateCriticAgentCache(ideas: BusinessIdea[], agentName: string = 'CriticAgent'): Promise<void> {
    await this.simulateCachedResults({
      agentName,
      items: ideas,
      statusMessage: '📦 Loading cached critical evaluations...',
      progressMessageBuilder: (idea, index, total) => 
        `🎯 Evaluating idea ${index + 1}/${total}: ${idea.title}`,
      metadataBuilder: (idea, index, total) => ({
        stage: 'critical-evaluation',
        data: {
          ideaId: idea.id,
          criticalCount: index + 1,
          totalIdeas: total,
          evaluation: {
            ideaId: idea.id,
            ideaTitle: idea.title,
            overallScore: idea.overallScore
          }
        }
      })
    });
  }

  /**
   * Helper method specifically for DocumentationAgent cached results
   */
  async simulateDocumentationAgentCache(
    documentationResult: DocumentationAgentOutput,
    criticallyEvaluatedIdeas: BusinessIdea[],
    agentName: string = 'DocumentationAgent'
  ): Promise<void> {
    // Emit initial status
    this.emitEvent('status', agentName, '📦 Loading cached documentation...', 'info');
    
    // Simulate processing each idea with delays
    const totalIdeas = documentationResult.ideasProcessed || criticallyEvaluatedIdeas.length;
    for (let i = 0; i < totalIdeas; i++) {
      // Random delay between 500ms and 1000ms
      const delay = Math.floor(Math.random() * 500) + 500;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Emit idea processed event
      this.emitEvent(
        'progress',
        agentName,
        `✅ Documented idea ${i + 1}/${totalIdeas}`,
        'info',
        {
          progress: Math.round(((i + 1) / totalIdeas) * 100),
          stage: 'documentation',
          data: {
            ideaId: criticallyEvaluatedIdeas[i]?.id,
            index: i + 1,
            total: totalIdeas,
            title: criticallyEvaluatedIdeas[i]?.title || `Idea ${i + 1}`
          }
        }
      );
    }
    
    // Emit section generation events
    const sections = ['Executive Summary', 'Market Analysis', 'Competitive Landscape', 'Risk Assessment', 'Recommendations'];
    for (const section of sections) {
      const delay = Math.floor(Math.random() * 500) + 500;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      this.emitEvent(
        'progress',
        agentName,
        `📝 Generated section: ${section}`,
        'info',
        {
          stage: 'section-generation',
          data: {
            section: section
          }
        }
      );
    }
    
    // Emit completion event
    this.emitEvent('status', agentName, '✅ Documentation generation complete!', 'info');
    
    // Emit result event
    this.emitEvent(
      'result',
      agentName,
      `📄 Report saved to: ${documentationResult.reportPath}`,
      'info',
      {
        data: {
          reportPath: documentationResult.reportPath,
          ideasProcessed: documentationResult.ideasProcessed,
          processingTime: documentationResult.processingTime
        }
      }
    );
  }
}