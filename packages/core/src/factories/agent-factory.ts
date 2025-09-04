import { Agent } from '@openai/agents';
import { aisdk } from '@openai/agents-extensions';
import type { Tool } from '@openai/agents';
import { OpenAIAdapter } from '../adapters/openai-adapter.js';
import { AnthropicAdapter } from '../adapters/anthropic-adapter.js';
import { GoogleAdapter } from '../adapters/google-adapter.js';
import type { 
  AgentFactoryConfig, 
  ProviderAdapter,
  SupportedProvider 
} from '../types/provider-types.js';
import { loggingService } from '../services/logging-service.js';

export class AgentFactory {
  private static adapters: Map<SupportedProvider, ProviderAdapter> = new Map();
  
  static {
    // Register provider adapters
    AgentFactory.adapters.set('openai', new OpenAIAdapter());
    AgentFactory.adapters.set('anthropic', new AnthropicAdapter());
    AgentFactory.adapters.set('google', new GoogleAdapter());
  }
  
  /**
   * Creates a hosted web search tool for the specified provider
   */
  private static createHostedWebSearchTool(provider: SupportedProvider, adapter: ProviderAdapter): Tool | null {
    if (!adapter.supportsWebSearch()) {
      return null;
    }

    switch (provider) {
      case 'openai':
        // OpenAI uses the standard webSearchTool from @openai/agents
        return adapter.getWebSearchTool?.() as Tool;
      
      case 'anthropic':
        return {
          type: 'hosted_tool',
          name: 'webSearch_20250305',  // Anthropic's versioned tool name
          providerData: {
            args: {
              maxUses: 15,
              // Add other Anthropic-specific configuration
            }
          }
        } as Tool;
      
      case 'google':
        return {
          type: 'hosted_tool',
          name: 'google_search',  // Google's tool name
          providerData: {
            args: {}  // Google search has minimal configuration
          }
        } as Tool;
      
      default:
        return null;
    }
  }
  
  /**
   * Creates an agent with provider-specific configuration
   */
  static createAgent(config: AgentFactoryConfig, apiKey: string): Agent {
    const adapter = this.adapters.get(config.provider);
    
    if (!adapter) {
      throw new Error(`Unsupported provider: ${config.provider}`);
    }
    
    loggingService.info(`Creating agent for provider: ${config.provider}, model: ${config.model}`);
    
    // Create the base model using the provider adapter
    const model = adapter.createModel(config.model, apiKey);
    
    // Prepare tools based on provider
    const tools: Tool[] = [];

    // Add web search tool if enabled
    if (config.enableWebSearch) {
      const webSearchTool = this.createHostedWebSearchTool(config.provider, adapter);
      if (webSearchTool) {
        tools.push(webSearchTool);
        loggingService.debug(`Added ${config.provider} web search tool`);
      }
    }

    // Add custom tools if provided
    if (config.customTools) {
      // Custom tools should be in OpenAI Agents format
      config.customTools.forEach(tool => {
        tools.push(tool as Tool);
      });
    }

    // Wrap the model with the aisdk adapter
    const adaptedModel = aisdk(model);

    // Create and return the agent with tools
    const agent = new Agent({
      name: config.name,
      instructions: config.instructions,
      model: adaptedModel,
      tools: tools  // Pass tools here, not empty array
    });
    
    loggingService.info(`Agent "${config.name}" created successfully with provider ${config.provider}`);
    loggingService.debug('Agent tools:', JSON.stringify(tools, null, 2));
    
    return agent;
  }
  
  /**
   * Get the appropriate API key for a provider
   */
  static getApiKey(provider: SupportedProvider): string {
    const keyMap: Record<SupportedProvider, string> = {
      openai: process.env.OPENAI_API_KEY || '',
      anthropic: process.env.ANTHROPIC_API_KEY || '',
      google: process.env.GOOGLE_API_KEY || ''
    };
    
    const apiKey = keyMap[provider];
    
    if (!apiKey) {
      throw new Error(`API key for provider ${provider} is not configured`);
    }
    
    return apiKey;
  }
}