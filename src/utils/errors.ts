/**
 * Custom error class for agent-related failures.
 */
export class AgentError extends Error {
  constructor(message: string, public readonly agentName: string) {
    super(`[${agentName}] ${message}`);
    this.name = 'AgentError';
  }
}