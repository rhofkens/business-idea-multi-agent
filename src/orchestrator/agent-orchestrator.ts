import { run } from '@openai/agents';
import { ideationAgent } from '../agents/ideation-agent.js';
import { competitorAgent } from '../agents/competitor-agent.js';
import { criticAgent } from '../agents/critic-agent.js';
import { documentationAgent } from '../agents/documentation-agent.js';
import { loggingService } from '../services/logging-service.js';

/**
 * Orchestrates the sequential execution of the agent chain.
 */
export class AgentOrchestrator {
  public async runChain(): Promise<string> {
    let currentInput = 'Start';
    let finalOutput = '';

    const agents = [ideationAgent, competitorAgent, criticAgent, documentationAgent];

    for (const agent of agents) {
      loggingService.log({ level: 'INFO', message: `Starting agent: ${agent.name}` });
      try {
        const result = await run(agent, currentInput);
        const output = result.finalOutput as string;

        loggingService.log({
          level: 'INFO',
          message: `Agent ${agent.name} finished.`,
          agent: agent.name,
          details: `Output: ${output.substring(0, 50)}...`
        });

        currentInput = output; // Pass the output of one agent as the input to the next
        finalOutput += `${agent.name} acknowledged. -> `;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        loggingService.log({
          level: 'ERROR',
          message: `Agent ${agent.name} failed.`,
          agent: agent.name,
          details: errorMessage,
        });
        throw new Error(`Execution failed at agent: ${agent.name}`);
      }
    }
    
    // Clean up the final output string
    finalOutput = finalOutput.slice(0, -4);
    
    return finalOutput;
  }
}