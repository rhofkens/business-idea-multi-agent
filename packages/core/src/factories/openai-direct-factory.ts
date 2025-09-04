import { Agent } from '@openai/agents';
import { webSearchTool } from '@openai/agents';
import type { Tool } from '@openai/agents';
import { loggingService } from '../services/logging-service.js';

export interface OpenAIDirectAgentConfig {
  name: string;
  instructions: string;
  model: string;
  enableWebSearch?: boolean;
  customTools?: Tool[];
}

/**
 * Creates OpenAI agents directly without aisdk adapter
 * Used for agents that require web search functionality
 */
export class OpenAIDirectFactory {
  /**
   * Creates an OpenAI agent with native web search support
   */
  static createAgent(config: OpenAIDirectAgentConfig, _apiKey: string): Agent {
    loggingService.info(`Creating direct OpenAI agent: ${config.name}`);
    
    // Prepare tools
    const tools: Tool[] = [];
    
    // Add web search tool if enabled
    if (config.enableWebSearch) {
      tools.push(webSearchTool());
      loggingService.debug(`Added OpenAI native web search tool to ${config.name}`);
    }
    
    // Add custom tools if provided
    if (config.customTools) {
      tools.push(...config.customTools);
    }
    
    // Create agent with direct OpenAI model
    const agent = new Agent({
      name: config.name,
      instructions: config.instructions,
      model: config.model, // e.g., 'gpt-5-mini-2025-08-07'
      tools: tools
    });
    
    loggingService.info(`Agent "${config.name}" created with direct OpenAI integration`);
    loggingService.debug(`Tools configured: ${JSON.stringify(tools.map(t => (t as Tool & { name?: string }).name || 'web_search'), null, 2)}`);
    
    return agent;
  }
  
  /**
   * Validates that OpenAI API key is available
   */
  static validateApiKey(): string {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OpenAI API key is required for agents that use web search. ' +
        'Please set OPENAI_API_KEY in your environment variables.'
      );
    }
    return apiKey;
  }
}