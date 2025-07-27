import { runCriticAgent } from '../../agents/critic-agent.js';
import { loggingService } from '../../services/logging-service.js';
import { TestCacheService } from '../../services/test-cache-service.js';
import { BusinessIdea } from '@business-idea/shared';
import type {
  StepParams,
  CriticStepInput,
  CriticStepResult,
} from '../types/orchestrator-types.js';

/**
 * Executes the critic evaluation step of the orchestrator
 */
export async function runCriticStep({
  context,
  input,
}: StepParams<CriticStepInput>): Promise<CriticStepResult> {
  const { enrichedIdeas } = input;
  const { emitEvent, useTestCache, cacheEmitter } = context;

  if (enrichedIdeas.length === 0) {
    loggingService.log({
      level: 'INFO',
      message: 'No ideas to evaluate, skipping Business Critic Agent',
    });
    return {
      criticallyEvaluatedIdeas: enrichedIdeas,
      criticalCount: 0,
    };
  }

  console.log('\n\n🎯 Starting critical evaluation and risk assessment...\n');
  
  emitEvent('status', 'CriticAgent', `🎯 Starting critical evaluation for ${enrichedIdeas.length} ideas...`);
  
  loggingService.log({
    level: 'INFO',
    message: 'Starting Business Critic Agent',
    details: `Processing ${enrichedIdeas.length} business ideas for critical evaluation`,
  });

  let criticalCount = 0;

  // Use test cache for critic agent if enabled
  const criticallyEvaluatedIdeas = await TestCacheService.loadOrExecute(
    {
      enabled: useTestCache,
      fileName: 'critic-ideas.json'
    },
    async () => {
      // Initialize array to collect critically evaluated ideas
      let criticalEvaluatedIdeas: BusinessIdea[] = [];
      
      // Iterate through the generator
      const generator = runCriticAgent({ businessIdeas: enrichedIdeas });
      let iterResult = await generator.next();
      
      console.log(`📋 Starting critical evaluation...`);
      emitEvent('status', 'CriticAgent', '📋 Starting critical evaluation...');
      
      while (!iterResult.done) {
        const event = iterResult.value;
        
        switch (event.type) {
          case 'chunk':
            // Don't display raw chunks from critic agent
            break;

          case 'status':
            console.log(`📋 ${event.data}`);
            emitEvent('status', 'CriticAgent', event.data);
            break;

          case 'critical-analysis':
            criticalCount++;
            console.log(`\n🎯 Evaluating idea ${criticalCount}/${enrichedIdeas.length}: ${event.data.ideaTitle}`);
            console.log(`   📊 Overall Score: ${event.data.overallScore}/10`);
            console.log(`   🔍 Critical Analysis: ${event.data.analysis.substring(0, 150)}...`);
            console.log(`   ⏳ Progress: ${Math.round((criticalCount / enrichedIdeas.length) * 100)}% complete`);
            
            emitEvent(
              'progress',
              'CriticAgent',
              `🎯 Evaluating idea ${criticalCount}/${enrichedIdeas.length}: ${event.data.ideaTitle}`,
              'info',
              {
                progress: Math.round((criticalCount / enrichedIdeas.length) * 100),
                stage: 'critical-evaluation',
                data: {
                  ideaId: event.data.ideaId,
                  criticalCount,
                  totalIdeas: enrichedIdeas.length,
                  analysis: event.data
                }
              }
            );
            break;

          case 'complete':
            console.log('\n✅ Critical evaluation complete!');
            console.log(`📊 Total ideas evaluated: ${criticalCount}`);
            
            emitEvent(
              'status',
              'CriticAgent',
              `✅ Critical evaluation complete! Evaluated ${criticalCount} ideas.`,
              'info',
              {
                data: {
                  criticalCount
                }
              }
            );
            break;
        }
        
        iterResult = await generator.next();
      }
      
      // When done, iterResult.value contains the return value (array of critically evaluated ideas)
      criticalEvaluatedIdeas = iterResult.value as BusinessIdea[];
      
      // Ensure we have valid data before returning
      if (!criticalEvaluatedIdeas || criticalEvaluatedIdeas.length === 0) {
        console.warn('⚠️  Warning: No critically evaluated ideas returned from critic agent');
        return enrichedIdeas; // Fallback to original ideas
      }
      
      console.log(`📦 Successfully evaluated ${criticalEvaluatedIdeas.length} ideas with critical analysis`);
      return criticalEvaluatedIdeas;
    }
  );

  // Update count if loaded from cache
  if (useTestCache && criticallyEvaluatedIdeas.length > 0) {
    criticalCount = criticallyEvaluatedIdeas.length;
    console.log(`\n📦 Loaded ${criticallyEvaluatedIdeas.length} critically evaluated ideas from cache`);
    
    // Use the cache emitter to simulate cached results
    await cacheEmitter.simulateCriticAgentCache(criticallyEvaluatedIdeas);
  }

  // Log the first idea's Overall Score as per acceptance criteria
  if (criticallyEvaluatedIdeas.length > 0 && criticallyEvaluatedIdeas[0].overallScore !== undefined) {
    console.log(`\n📊 First Business Idea Overall Score: ${criticallyEvaluatedIdeas[0].overallScore}/10`);
    
    emitEvent(
      'result',
      'CriticAgent',
      `📊 First Business Idea Overall Score: ${criticallyEvaluatedIdeas[0].overallScore}/10`,
      'info',
      {
        data: {
          ideaId: criticallyEvaluatedIdeas[0].id,
          title: criticallyEvaluatedIdeas[0].title,
          overallScore: criticallyEvaluatedIdeas[0].overallScore,
          criticalAnalysis: criticallyEvaluatedIdeas[0].criticalAnalysis,
          reasoning: criticallyEvaluatedIdeas[0].reasoning
        }
      }
    );
    
    loggingService.log({
      level: 'INFO',
      message: 'First idea Overall Score',
      details: `Title: "${criticallyEvaluatedIdeas[0].title}", Score: ${criticallyEvaluatedIdeas[0].overallScore}/10`,
    });
  }

  loggingService.log({
    level: 'INFO',
    message: 'Business Critic Agent finished successfully.',
    details: `Critically evaluated ${criticalCount} business ideas.`,
  });

  return {
    criticallyEvaluatedIdeas,
    criticalCount,
  };
}