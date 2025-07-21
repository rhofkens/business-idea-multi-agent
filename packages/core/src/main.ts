import { configService } from './services/config-service.js';
import { loggingService } from './services/logging-service.js';
import { AgentOrchestrator } from './orchestrator/agent-orchestrator.js';
import type { BusinessPreferences } from '@business-idea/shared';

async function main() {
  loggingService.log({ level: 'INFO', message: 'Application starting.' });
  
  // Check for test cache flag
  const useTestCache = process.argv.includes('--test-cache');
  if (useTestCache) {
    console.log('🧪 Test cache mode enabled - will use cached results when available');
  }
  
  // Verify API key is loaded
  if (!configService.openAIApiKey) {
    loggingService.log({ level: 'ERROR', message: 'OpenAI API key is missing. Shutting down.' });
    process.exit(1);
  }

  const orchestrator = new AgentOrchestrator();

  // Default preferences for CLI usage
  const defaultPreferences: BusinessPreferences = {
    vertical: 'Media & Entertainment',
    subVertical: 'Digital Media and Content Creation',
    businessModel: 'B2B SaaS',
    additionalContext: 'CLI-based execution with default preferences'
  };

  try {
    const finalResult = await orchestrator.runChain(defaultPreferences, useTestCache);
    console.log('Agent chain executed successfully.');
    console.log('Final Output:', finalResult);
    loggingService.log({ level: 'INFO', message: 'Application finished successfully.', details: `Final output: ${finalResult}` });
    process.exit(0);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during orchestration.';
    console.error(errorMessage);
    loggingService.log({ level: 'ERROR', message: 'Application failed during execution.', details: errorMessage });
    process.exit(1);
  }
}

main();