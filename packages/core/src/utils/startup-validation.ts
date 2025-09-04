import { configService } from '../services/config-service.js';

export function validateStartupConfiguration(): void {
  console.log('====================================');
  console.log('Multi-Agent System Configuration');
  console.log('====================================');
  
  // Check web search configuration
  if (configService.enableWebSearch) {
    console.log('Web Search: ENABLED');
    
    // Validate OpenAI is available for web search
    if (!configService.openAIApiKey) {
      console.error('ERROR: Web search enabled but OpenAI API key not found');
      throw new Error('Web search requires OpenAI API key');
    }
    
    // Warn if critic/competitor are using non-OpenAI providers
    if (configService.criticModelSpec.provider !== 'openai') {
      console.warn(
        `WARNING: Critic agent configured with ${configService.criticModelSpec.provider} ` +
        `but will use OpenAI for web search capability`
      );
    }
    
    if (configService.competitorModelSpec.provider !== 'openai') {
      console.warn(
        `WARNING: Competitor agent configured with ${configService.competitorModelSpec.provider} ` +
        `but will use OpenAI for web search capability`
      );
    }
  } else {
    console.log('Web Search: DISABLED');
  }
  
  console.log('\nAgent Configuration:');
  console.log(`  Ideation: ${configService.ideationModelSpec.provider}/${configService.ideationModelSpec.model}`);
  console.log(`  Documentation: ${configService.documentationModelSpec.provider}/${configService.documentationModelSpec.model}`);
  console.log(`  Critic: ${configService.criticModelSpec.provider}/${configService.criticModelSpec.model}${configService.enableWebSearch ? ' (→ OpenAI for web search)' : ''}`);
  console.log(`  Competitor: ${configService.competitorModelSpec.provider}/${configService.competitorModelSpec.model}${configService.enableWebSearch ? ' (→ OpenAI for web search)' : ''}`);
  
  console.log('====================================\n');
}