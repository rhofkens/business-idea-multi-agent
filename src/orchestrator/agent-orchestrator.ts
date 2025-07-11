import { ideationAgent } from '../agents/ideation-agent.js';
import { runCompetitorAgent } from '../agents/competitor-agent.js';
// import { criticAgent } from '../agents/critic-agent.js';
// import { documentationAgent } from '../agents/documentation-agent.js';
import { loggingService } from '../services/logging-service.js';
import { BusinessPreferences, BusinessIdea } from '../types/business-idea.js';
import { TestCacheService } from '../services/test-cache-service.js';

/**
 * Orchestrates the sequential execution of the agent chain.
 */
export class AgentOrchestrator {
  /**
   * Runs the full agent chain, from ideation to documentation.
   * @returns A promise that resolves to a success message.
   */
  public async runChain(useTestCache = false): Promise<string> {
    const preferences: BusinessPreferences = {
      vertical: 'Media & Entertainment',
      subVertical: 'Digital Media and Content Creation',
      businessModel: 'B2B SaaS',
    };

    loggingService.log({
      level: 'INFO',
      message: 'Starting Ideation Agent with preferences:',
      details: JSON.stringify(preferences),
    });

    try {
      console.log('🚀 Starting business idea generation...\n');
      console.log('--- Raw stream output ---');
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
            break;

          case 'idea':
            ideaCount++;
            ideas.push(event.data);

            console.log('\n\n--- Initial Idea ---');
            console.log(`💡 Idea ${ideaCount}: ${event.data.title}`);
            console.log(`   Industry: ${event.data.businessModel}`);
            console.log(`   Innovation Score: ${event.data.disruptionPotential}/10`);
            console.log(`   ${event.data.description}`);
            console.log('--- Continuing stream ---');
            break;

          case 'refined-idea':
            refinedIdeaCount++;
            collectedIdeas.push(event.data);

            console.log('\n\n--- Refined Idea ---');
            console.log(`🌟 Refined Idea ${refinedIdeaCount}: ${event.data.title}`);
            console.log(`   Industry: ${event.data.businessModel}`);
            console.log(`   Innovation Score: ${event.data.disruptionPotential}/10`);
            console.log(`   Market Potential: ${event.data.marketPotential}/10`);
            console.log(`   Technical Complexity: ${event.data.technicalComplexity}/10`);
            console.log(`   Capital Intensity: ${event.data.capitalIntensity}/10`);
            console.log(`   ${event.data.description}`);
            console.log(`   📊 Disruption Reasoning: ${event.data.reasoning.disruption}`);
            break;

          case 'complete':
            console.log('\n\n✅ Generation complete!');
            console.log(`Total initial ideas generated: ${ideaCount}`);
            console.log(`Total refined ideas: ${refinedIdeaCount}`);
            
            if (ideaCount !== 10) {
              console.warn(`⚠️  Expected 10 ideas but got ${ideaCount}. Some ideas may have failed validation.`);
              loggingService.log({
                level: 'WARN',
                message: 'Generated fewer ideas than expected.',
                details: `Expected 10 ideas but got ${ideaCount}. Check logs for validation errors.`,
              });
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
      }

      // Step 2: Run Competitor Analysis Agent
      let enrichedIdeas: BusinessIdea[] = refinedIdeas;
      let competitorCount = 0;
      
      if (refinedIdeas.length > 0) {
        console.log('\n\n🔍 Starting competitor analysis...\n');
        
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
            
            while (!iterResult.done) {
              const event = iterResult.value;
              
              switch (event.type) {
                case 'chunk':
                  // Don't display raw chunks from competitor agent
                  break;

                case 'status':
                  console.log(`📋 ${event.data}`);
                  break;

                case 'competitor-analysis':
                  competitorCount++;
                  console.log(`\n🎯 Analyzing idea ${competitorCount}/${refinedIdeas.length}: ${event.data.ideaTitle}`);
                  console.log(`   📊 Blue Ocean Score: ${event.data.blueOceanScore}/10`);
                  console.log(`   🔍 Market Analysis: ${event.data.analysis.substring(0, 150)}...`);
                  console.log(`   ⏳ Progress: ${Math.round((competitorCount / refinedIdeas.length) * 100)}% complete`);
                  break;

                case 'complete':
                  console.log('\n✅ Competitor analysis complete!');
                  console.log(`📊 Total ideas analyzed: ${competitorCount}`);
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

      return 'Agent chain completed successfully.';
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      loggingService.log({
        level: 'ERROR',
        message: 'Agent chain execution failed.',
        details: errorMessage,
      });
      throw new Error(`Execution failed: ${errorMessage}`);
    }
  }
}