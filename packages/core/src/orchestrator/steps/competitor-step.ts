import { runCompetitorAgent } from '../../agents/competitor-agent.js';
import { loggingService } from '../../services/logging-service.js';
import { TestCacheService } from '../../services/test-cache-service.js';
import { BusinessIdea } from '@business-idea/shared';
import { ideaRepository } from '../../data/repositories/idea-repository.js';
import type {
  StepParams,
  CompetitorStepInput,
  CompetitorStepResult,
} from '../types/orchestrator-types.js';

/**
 * Executes the competitor analysis step of the orchestrator
 */
export async function runCompetitorStep({
  context,
  input,
}: StepParams<CompetitorStepInput>): Promise<CompetitorStepResult> {
  const { refinedIdeas } = input;
  const { emitEvent, useTestCache, cacheEmitter } = context;

  if (refinedIdeas.length === 0) {
    loggingService.log({
      level: 'INFO',
      message: 'No ideas to analyze, skipping Competitor Analysis Agent',
    });
    return {
      enrichedIdeas: refinedIdeas,
      competitorCount: 0,
    };
  }

  console.log('\n\n🔍 Starting competitor analysis...\n');
  
  emitEvent('status', 'CompetitorAgent', `🔍 Starting competitor analysis for ${refinedIdeas.length} ideas...`);
  
  loggingService.log({
    level: 'INFO',
    message: 'Starting Competitor Analysis Agent',
    details: `Processing ${refinedIdeas.length} business ideas`,
  });

  let competitorCount = 0;

  // Use test cache for competitor agent if enabled
  const enrichedIdeas = await TestCacheService.loadOrExecute(
    {
      enabled: useTestCache,
      fileName: 'competitor-ideas.json'
    },
    async () => {
      // Initialize array to collect enriched ideas
      let competitorEnrichedIdeas: BusinessIdea[] = [];
      
      // Iterate through the generator
      const generator = runCompetitorAgent({ businessIdeas: refinedIdeas });
      let iterResult = await generator.next();
      
      console.log(`📋 Starting competitor analysis...`);
      emitEvent('status', 'CompetitorAgent', '📋 Starting competitor analysis...');
      
      while (!iterResult.done) {
        const event = iterResult.value;
        
        switch (event.type) {
          case 'chunk':
            // Don't display raw chunks from competitor agent
            break;

          case 'status':
            console.log(`📋 ${event.data}`);
            emitEvent('status', 'CompetitorAgent', event.data);
            break;

          case 'competitor-analysis':
            competitorCount++;
            console.log(`\n🎯 Analyzing idea ${competitorCount}/${refinedIdeas.length}: ${event.data.ideaTitle}`);
            console.log(`   📊 Blue Ocean Score: ${event.data.blueOceanScore}/10`);
            console.log(`   🔍 Market Analysis: ${event.data.analysis.substring(0, 150)}...`);
            console.log(`   ⏳ Progress: ${Math.round((competitorCount / refinedIdeas.length) * 100)}% complete`);
            
            // Update idea stage in database with competitor analysis data
            if (context.runId && context.userId) {
              try {
                await ideaRepository.updateIdeaStage(event.data.ideaId, 'competitor', {
                  blueOceanScore: event.data.blueOceanScore,
                  competitorAnalysis: event.data.analysis,
                });
                console.log(`   💾 Competitor analysis persisted to database`);
              } catch (error) {
                console.error(`   ❌ Failed to persist competitor analysis:`, error);
                loggingService.log({
                  level: 'ERROR',
                  message: 'Failed to persist competitor analysis to database',
                  details: JSON.stringify({ ideaId: event.data.ideaId, error: String(error) }),
                });
              }
            }
            
            emitEvent(
              'progress',
              'CompetitorAgent',
              `🎯 Analyzing idea ${competitorCount}/${refinedIdeas.length}: ${event.data.ideaTitle}`,
              'info',
              {
                progress: Math.round((competitorCount / refinedIdeas.length) * 100),
                stage: 'competitor-analysis',
                data: {
                  ideaId: event.data.ideaId,
                  competitorCount,
                  totalIdeas: refinedIdeas.length,
                  analysis: event.data
                }
              }
            );
            break;

          case 'complete':
            console.log('\n✅ Competitor analysis complete!');
            console.log(`📊 Total ideas analyzed: ${competitorCount}`);
            
            emitEvent(
              'status',
              'CompetitorAgent',
              `✅ Competitor analysis complete! Analyzed ${competitorCount} ideas.`,
              'info',
              {
                data: {
                  competitorCount
                }
              }
            );
            break;
        }
        
        iterResult = await generator.next();
      }
      
      // When done, iterResult.value contains the return value (array of enriched ideas)
      competitorEnrichedIdeas = iterResult.value as BusinessIdea[];
      
      // Ensure we have valid data before returning
      if (!competitorEnrichedIdeas || competitorEnrichedIdeas.length === 0) {
        console.warn('⚠️  Warning: No enriched ideas returned from competitor agent');
        return refinedIdeas; // Fallback to original ideas
      }
      
      console.log(`📦 Successfully analyzed ${competitorEnrichedIdeas.length} ideas with competitor insights`);
      return competitorEnrichedIdeas;
    }
  );

  // Update count if loaded from cache
  if (useTestCache && enrichedIdeas.length > 0) {
    competitorCount = enrichedIdeas.length;
    console.log(`\n📦 Loaded ${enrichedIdeas.length} competitor-analyzed ideas from cache`);
    
    // Use the cache emitter to simulate cached results
    await cacheEmitter.simulateCompetitorAgentCache(enrichedIdeas);
  }

  // Log the first idea's Blue Ocean score as per acceptance criteria
  if (enrichedIdeas.length > 0 && enrichedIdeas[0].blueOceanScore !== undefined) {
    console.log(`\n📊 First Business Idea Blue Ocean Score: ${enrichedIdeas[0].blueOceanScore}/10`);
    
    loggingService.log({
      level: 'INFO',
      message: 'First idea Blue Ocean score',
      details: `Title: "${enrichedIdeas[0].title}", Score: ${enrichedIdeas[0].blueOceanScore}/10`,
    });
  }

  loggingService.log({
    level: 'INFO',
    message: 'Competitor Analysis Agent finished successfully.',
    details: `Analyzed ${competitorCount} business ideas.`,
  });

  return {
    enrichedIdeas,
    competitorCount,
  };
}