import { ideationAgent } from '../agents/ideation-agent.js';
// import { competitorAgent } from '../agents/competitor-agent.js';
// import { criticAgent } from '../agents/critic-agent.js';
// import { documentationAgent } from '../agents/documentation-agent.js';
import { loggingService } from '../services/logging-service.js';
import { BusinessPreferences, BusinessIdea } from '../types/business-idea.js';

/**
 * Orchestrates the sequential execution of the agent chain.
 */
export class AgentOrchestrator {
  /**
   * Runs the full agent chain, from ideation to documentation.
   * @returns A promise that resolves to a success message.
   */
  public async runChain(): Promise<string> {
    const preferences: BusinessPreferences = {
      vertical: 'Media & Entertainment',
      subVertical: 'Streaming Services',
      businessModel: 'B2B2C',
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
const refinedIdeas: BusinessIdea[] = [];

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
      refinedIdeas.push(event.data);

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