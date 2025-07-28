import { ideationAgent } from '../../agents/ideation-agent.js';
import { loggingService } from '../../services/logging-service.js';
import { TestCacheService } from '../../services/test-cache-service.js';
import { BusinessIdea } from '@business-idea/shared';
import { ideaRepository } from '../../data/repositories/idea-repository.js';
import type {
  StepParams,
  IdeationStepInput,
  IdeationStepResult,
} from '../types/orchestrator-types.js';

/**
 * Executes the ideation step of the orchestrator
 */
export async function runIdeationStep({
  context,
  input,
}: StepParams<IdeationStepInput>): Promise<IdeationStepResult> {
  const { preferences } = input;
  const { emitEvent, useTestCache, cacheEmitter } = context;

  loggingService.log({
    level: 'INFO',
    message: 'Starting Ideation Agent with preferences:',
    details: JSON.stringify(preferences),
  });

  console.log('🚀 Starting business idea generation...\n');
  console.log('--- Raw stream output ---');
  
  emitEvent('status', 'Orchestrator', '🚀 Starting business idea generation...');
  
  let ideaCount = 0;
  let refinedIdeaCount = 0;
  const ideas: BusinessIdea[] = [];
  let refinedIdeas: BusinessIdea[] = [];

  // Use test cache for ideation agent if enabled
  refinedIdeas = await TestCacheService.loadOrExecute(
    {
      enabled: useTestCache,
      fileName: 'ideation-ideas.json'
    },
    async () => {
      const collectedIdeas: BusinessIdea[] = [];
      
      for await (const event of ideationAgent.execute(preferences)) {
        switch (event.type) {
          case 'chunk':
            process.stdout.write(event.data);
            break;

          case 'status':
            console.log(`\n\n📋 ${event.data}\n`);
            emitEvent('status', 'IdeationAgent', event.data);
            break;

          case 'idea':
            ideaCount++;
            ideas.push(event.data);

            console.log('\n--- Initial Idea ---');
            console.log(`💡 Idea ${ideaCount}: ${event.data.title}`);
            console.log(`   Industry: ${event.data.businessModel}`);
            console.log(`   Disruption Potential: ${event.data.disruptionPotential}/10`);
            console.log(`   Market Potential: ${event.data.marketPotential}/10`);
            console.log(`   Technical Complexity: ${event.data.technicalComplexity}/10`);
            console.log(`   Capital Intensity: ${event.data.capitalIntensity}/10`);
            console.log(`   Description: ${event.data.description}`);
            console.log('\n\n--- Continuing stream ---');
            
            emitEvent(
              'result',
              'IdeationAgent',
              `💡 Idea ${ideaCount}: ${event.data.title}`,
              'info',
              {
                data: {
                  ideaId: event.data.id,
                  ideaCount,
                  idea: event.data
                }
              }
            );
            break;

          case 'refined-idea':
            refinedIdeaCount++;
            collectedIdeas.push(event.data);

            // Persist idea to database if runId and userId are available
            if (context.runId && context.userId) {
              try {
                await ideaRepository.createIdea(context.runId, context.userId, event.data);
                console.log(`   💾 Idea persisted to database`);
              } catch (error) {
                console.error(`   ❌ Failed to persist idea to database:`, error);
                loggingService.log({
                  level: 'ERROR',
                  message: 'Failed to persist idea to database',
                  details: JSON.stringify({ ideaId: event.data.id, error: String(error) }),
                });
              }
            }

            console.log('\n\n--- Refined Idea ---');
            console.log(`🌟 Refined Idea ${refinedIdeaCount}: ${event.data.title}`);
            console.log(`   Industry: ${event.data.businessModel}`);
            console.log(`   Disruption Potential: ${event.data.disruptionPotential}/10`);
            console.log(`   Market Potential: ${event.data.marketPotential}/10`);
            console.log(`   Technical Complexity: ${event.data.technicalComplexity}/10`);
            console.log(`   Capital Intensity: ${event.data.capitalIntensity}/10`);
            console.log(`   Description: ${event.data.description}`);
            if (event.data.reasoning) {
              console.log('   Reasoning:');
              console.log(`     - Disruption: ${event.data.reasoning.disruption}`);
              console.log(`     - Market: ${event.data.reasoning.market}`);
              console.log(`     - Technical: ${event.data.reasoning.technical}`);
              console.log(`     - Capital: ${event.data.reasoning.capital}`);
            }
            
            emitEvent(
              'result',
              'IdeationAgent',
              `🌟 Refined Idea ${refinedIdeaCount}: ${event.data.title}`,
              'info',
              {
                data: {
                  ideaId: event.data.id,
                  refinedIdeaCount,
                  refinedIdea: event.data
                }
              }
            );
            break;

          case 'complete':
            console.log('\n\n✅ Generation complete!');
            console.log(`Total initial ideas generated: ${ideaCount}`);
            console.log(`Total refined ideas: ${refinedIdeaCount}`);
            
            emitEvent(
              'status',
              'IdeationAgent',
              `✅ Generation complete! Generated ${ideaCount} initial ideas and ${refinedIdeaCount} refined ideas.`,
              'info',
              {
                data: {
                  ideaCount,
                  refinedIdeaCount
                }
              }
            );
            
            if (ideaCount !== 10) {
              console.warn(`⚠️  Expected 10 ideas but got ${ideaCount}. Some ideas may have failed validation.`);
              loggingService.log({
                level: 'WARN',
                message: 'Generated fewer ideas than expected.',
                details: `Expected 10 ideas but got ${ideaCount}. Check logs for validation errors.`,
              });
              
              emitEvent(
                'error',
                'IdeationAgent',
                `⚠️  Expected 10 ideas but got ${ideaCount}. Some ideas may have failed validation.`,
                'warn'
              );
            }
            
            loggingService.log({
              level: 'INFO',
              message: 'Ideation Agent finished successfully.',
              details: `Generated ${ideaCount} initial ideas and ${refinedIdeaCount} refined ideas.`,
            });
            break;
        }
      }
      
      return collectedIdeas;
    }
  );

  // Update counts if loaded from cache
  if (useTestCache && refinedIdeas.length > 0) {
    ideaCount = refinedIdeas.length;
    refinedIdeaCount = refinedIdeas.length;
    console.log(`\n📦 Loaded ${refinedIdeas.length} ideas from cache`);
    
    // Use the cache emitter to simulate cached results
    await cacheEmitter.simulateIdeationAgentCache(refinedIdeas);
  }

  return {
    refinedIdeas,
    ideaCount,
    refinedIdeaCount,
  };
}