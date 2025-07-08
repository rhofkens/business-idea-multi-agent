import { configService } from './services/config-service.js';
import { loggingService } from './services/logging-service.js';
import { AgentOrchestrator } from './orchestrator/agent-orchestrator.js';

async function main() {
  loggingService.log({ level: 'INFO', message: 'Application starting.' });
  
  // Verify API key is loaded
  if (!configService.openAIApiKey) {
    loggingService.log({ level: 'ERROR', message: 'OpenAI API key is missing. Shutting down.' });
    process.exit(1);
  }

  const orchestrator = new AgentOrchestrator();

  try {
    const finalResult = await orchestrator.runChain();
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