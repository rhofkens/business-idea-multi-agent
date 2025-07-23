import { ideationAgent } from '../agents/ideation-agent.js';
import { runCompetitorAgent } from '../agents/competitor-agent.js';
import { runCriticAgentWithCache } from '../agents/critic-agent.js';
import { runDocumentationAgent } from '../agents/documentation-agent.js';
import { loggingService } from '../services/logging-service.js';
import { BusinessPreferences, BusinessIdea } from '@business-idea/shared';
import { TestCacheService } from '../services/test-cache-service.js';
import type { DocumentationAgentOutput } from '../types/agent-types.js';
import { WebSocketSessionManager } from '../services/websocket-session-manager.js';
import type { WorkflowEvent } from '@business-idea/shared';
import { WebSocketCacheEmitter } from '../services/websocket-cache-emitter.js';

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
    loggingService.log({
      level: 'INFO',
      message: 'Starting Ideation Agent with preferences:',
      details: JSON.stringify(preferences),
    });

    try {
      console.log('🚀 Starting business idea generation...\n');
      console.log('--- Raw stream output ---');
      
      this.emitEvent('status', 'Orchestrator', '🚀 Starting business idea generation...');
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
                  this.emitEvent('status', 'IdeationAgent', event.data);
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
              
              this.emitEvent(
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
                  
                  this.emitEvent(
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
            
            this.emitEvent(
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
              
              this.emitEvent(
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
        await this.cacheEmitter.simulateIdeationAgentCache(refinedIdeas);
      }

      // Step 2: Run Competitor Analysis Agent
      let enrichedIdeas: BusinessIdea[] = refinedIdeas;
      let competitorCount = 0;
      
      if (refinedIdeas.length > 0) {
        console.log('\n\n🔍 Starting competitor analysis...\n');
        
        this.emitEvent('status', 'CompetitorAgent', `🔍 Starting competitor analysis for ${refinedIdeas.length} ideas...`);
        
        loggingService.log({
          level: 'INFO',
          message: 'Starting Competitor Analysis Agent',
          details: `Processing ${refinedIdeas.length} business ideas`,
        });

        // Use test cache for competitor agent if enabled
        enrichedIdeas = await TestCacheService.loadOrExecute(
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
            this.emitEvent('status', 'CompetitorAgent', '📋 Starting competitor analysis...');
            
            while (!iterResult.done) {
              const event = iterResult.value;
              
              switch (event.type) {
                case 'chunk':
                  // Don't display raw chunks from competitor agent
                  break;

                case 'status':
                  console.log(`📋 ${event.data}`);
                  this.emitEvent('status', 'CompetitorAgent', event.data);
                  break;

                case 'competitor-analysis':
                  competitorCount++;
                  console.log(`\n🎯 Analyzing idea ${competitorCount}/${refinedIdeas.length}: ${event.data.ideaTitle}`);
                  console.log(`   📊 Blue Ocean Score: ${event.data.blueOceanScore}/10`);
                  console.log(`   🔍 Market Analysis: ${event.data.analysis.substring(0, 150)}...`);
                  console.log(`   ⏳ Progress: ${Math.round((competitorCount / refinedIdeas.length) * 100)}% complete`);
                  
                  this.emitEvent(
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
                  
                  this.emitEvent(
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
          await this.cacheEmitter.simulateCompetitorAgentCache(enrichedIdeas);
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
      }

      // Step 3: Run Business Critic Agent
      let criticallyEvaluatedIdeas: BusinessIdea[] = enrichedIdeas;
      let criticalCount = 0;
      
      if (enrichedIdeas.length > 0) {
        console.log('\n\n🎯 Starting critical evaluation and risk assessment...\n');
        
        this.emitEvent('status', 'CriticAgent', `🎯 Starting critical evaluation for ${enrichedIdeas.length} ideas...`);
        
        loggingService.log({
          level: 'INFO',
          message: 'Starting Business Critic Agent',
          details: `Processing ${enrichedIdeas.length} business ideas for critical evaluation`,
        });

        // Use test cache for critic agent if enabled
        criticallyEvaluatedIdeas = await runCriticAgentWithCache(
          { businessIdeas: enrichedIdeas },
          useTestCache
        );

        // Update count
        criticalCount = criticallyEvaluatedIdeas.length;
        
        if (useTestCache && criticallyEvaluatedIdeas.length > 0) {
          console.log(`\n📦 Loaded ${criticallyEvaluatedIdeas.length} critically evaluated ideas from cache`);
          
          // Use the cache emitter to simulate cached results
          await this.cacheEmitter.simulateCriticAgentCache(criticallyEvaluatedIdeas);
        }

        // Log the first idea's Overall Score as per acceptance criteria
        if (criticallyEvaluatedIdeas.length > 0 && criticallyEvaluatedIdeas[0].overallScore !== undefined) {
          console.log(`\n📊 First Business Idea Overall Score: ${criticallyEvaluatedIdeas[0].overallScore}/10`);
          
          this.emitEvent(
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
        
        this.emitEvent(
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
      }

      // Step 4: Run Documentation Agent
      let documentationResult = null;
      
      if (criticallyEvaluatedIdeas.length > 0) {
        console.log('\n\n📝 Starting documentation generation...\n');
        
        this.emitEvent('status', 'DocumentationAgent', `📝 Starting documentation generation for ${criticallyEvaluatedIdeas.length} ideas...`);
        
        loggingService.log({
          level: 'INFO',
          message: 'Starting Documentation Agent',
          details: `Processing ${criticallyEvaluatedIdeas.length} business ideas for documentation`,
        });

        // Use test cache for documentation agent if enabled
        documentationResult = await TestCacheService.loadOrExecute(
          {
            enabled: useTestCache,
            fileName: 'documentation-output.json'
          },
          async () => {
            console.log('\n🔷 Step 5: Documentation Agent');
            console.log('📝 Generating comprehensive business idea report...\n');
            
            const generator = runDocumentationAgent({ ideas: criticallyEvaluatedIdeas });
            let iterResult = await generator.next();
            let result: DocumentationAgentOutput | null = null;
            
            while (!iterResult.done) {
              const event = iterResult.value;
              
              switch (event.type) {
                case 'status':
                  console.log(`📋 ${event.data}`);
                  this.emitEvent('status', 'DocumentationAgent', event.data);
                  break;
                  
                case 'chunk':
                  // Don't display raw chunks from documentation agent
                  break;
                  
                case 'idea-processed':
                  console.log(`✅ Documented idea ${event.data.index}/${event.data.total}: ${event.data.title}`);
                  
                  this.emitEvent(
                    'progress',
                    'DocumentationAgent',
                    `✅ Documented idea ${event.data.index}/${event.data.total}: ${event.data.title}`,
                    'info',
                    {
                      progress: Math.round((event.data.index / event.data.total) * 100),
                      stage: 'documentation',
                      data: {
                        index: event.data.index,
                        total: event.data.total,
                        title: event.data.title
                      }
                    }
                  );
                  break;
                  
                case 'section-generated':
                  console.log(`📝 Generated section: ${event.data.section}`);
                  
                  this.emitEvent(
                    'progress',
                    'DocumentationAgent',
                    `📝 Generated section: ${event.data.section}`,
                    'info',
                    {
                      stage: 'section-generation',
                      data: {
                        section: event.data.section
                      }
                    }
                  );
                  break;
                  
                case 'complete':
                  console.log('\n✅ Documentation generation complete!');
                  
                  this.emitEvent(
                    'status',
                    'DocumentationAgent',
                    '✅ Documentation generation complete!'
                  );
                  break;
              }
              
              iterResult = await generator.next();
            }
            
            // When done, iterResult.value contains the return value
            result = iterResult.value as DocumentationAgentOutput;
            
            console.log(`📄 Report saved to: ${result.reportPath}`);
            console.log(`📊 Total ideas documented: ${result.ideasProcessed}`);
            console.log(`⏱️  Processing time: ${result.processingTime}ms`);
            
            this.emitEvent(
              'result',
              'DocumentationAgent',
              `📄 Report saved to: ${result.reportPath}`,
              'info',
              {
                data: {
                  reportPath: result.reportPath,
                  ideasProcessed: result.ideasProcessed,
                  processingTime: result.processingTime
                }
              }
            );
            
            return result;
          }
        );
// Update output if loaded from cache
if (useTestCache && documentationResult) {
  console.log(`\n📦 Loaded documentation result from cache`);
  
  // Use WebSocketCacheEmitter to simulate cached results
  await this.cacheEmitter.simulateDocumentationAgentCache(
    documentationResult,
    criticallyEvaluatedIdeas
          );
        }

        if (documentationResult) {
          loggingService.log({
            level: 'INFO',
            message: 'Documentation Agent finished successfully.',
            details: `Generated report at ${documentationResult.reportPath} with ${documentationResult.ideasProcessed} ideas.`,
          });
        }
      }

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