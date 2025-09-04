import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseModelSpec } from '../config/model-registry.js';
import type { SupportedProvider } from '../types/provider-types.js';

// Get the directory of this file
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from the project root
dotenv.config({ 
  path: path.resolve(__dirname, '../../../../.env')
});

interface ModelSpec {
  provider: SupportedProvider;
  model: string;
}

/**
 * Enhanced configuration service with multi-provider support
 */
class ConfigService {
  // Provider configuration
  public readonly defaultProvider: SupportedProvider;
  public readonly defaultModel: string;
  
  // API Keys
  public readonly openAIApiKey: string;
  public readonly anthropicApiKey: string;
  public readonly googleApiKey: string;
  
  // Model specifications for each agent
  public readonly ideationModelSpec: ModelSpec;
  public readonly competitorModelSpec: ModelSpec;
  public readonly criticModelSpec: ModelSpec;
  public readonly documentationModelSpec: ModelSpec;
  
  // Feature flags
  public readonly useRefinement: boolean;
  public readonly enableWebSearch: boolean;
  
  // Legacy compatibility
  public readonly llmModel: string;
  public readonly ideationModel: string;
  public readonly competitorModel: string;
  public readonly criticModel: string;
  public readonly documentationModel: string;

  constructor() {
    // Load provider configuration
    this.defaultProvider = (this.getOptionalEnvVariable('LLM_PROVIDER', 'openai') as SupportedProvider);
    this.defaultModel = this.getOptionalEnvVariable('LLM_MODEL', 'gpt-5-mini-2025-08-07');
    
    // Log the loaded configuration for debugging
    console.log('[Config Service] Loading configuration from .env file...');
    console.log('[Config Service] Loaded provider configuration:');
    console.log(`  Default Provider: ${this.defaultProvider}`);
    console.log(`  Default Model: ${this.defaultModel}`);
    
    // Load API keys
    this.openAIApiKey = this.getOptionalEnvVariable('OPENAI_API_KEY', '');
    this.anthropicApiKey = this.getOptionalEnvVariable('ANTHROPIC_API_KEY', '');
    this.googleApiKey = this.getOptionalEnvVariable('GOOGLE_API_KEY', '');
    
    // Validate at least one API key is present
    if (!this.openAIApiKey && !this.anthropicApiKey && !this.googleApiKey) {
      throw new Error('At least one provider API key must be configured');
    }
    
    // Parse model specifications for each agent
    this.ideationModelSpec = this.parseAgentModel('IDEATION_MODEL');
    this.competitorModelSpec = this.parseAgentModel('COMPETITOR_MODEL');
    this.criticModelSpec = this.parseAgentModel('CRITIC_MODEL');
    this.documentationModelSpec = this.parseAgentModel('DOCUMENTATION_MODEL');
    
    // Log agent-specific configurations
    console.log('[Config Service] Agent model specifications:');
    console.log(`  Ideation: ${this.ideationModelSpec.provider}/${this.ideationModelSpec.model}`);
    console.log(`  Competitor: ${this.competitorModelSpec.provider}/${this.competitorModelSpec.model}`);
    console.log(`  Critic: ${this.criticModelSpec.provider}/${this.criticModelSpec.model}`);
    console.log(`  Documentation: ${this.documentationModelSpec.provider}/${this.documentationModelSpec.model}`);
    
    // Feature flags
    this.useRefinement = this.getOptionalEnvVariable('USE_REFINEMENT', 'true') === 'true';
    this.enableWebSearch = this.getOptionalEnvVariable('ENABLE_WEB_SEARCH', 'true') === 'true';
    
    // Legacy compatibility - maintain backward compatibility
    this.llmModel = this.defaultModel;
    this.ideationModel = this.ideationModelSpec.model;
    this.competitorModel = this.competitorModelSpec.model;
    this.criticModel = this.criticModelSpec.model;
    this.documentationModel = this.documentationModelSpec.model;
  }
  
  private parseAgentModel(envKey: string): ModelSpec {
    const value = process.env[envKey];
    
    if (value) {
      // Parse provider:model format or use registry
      const spec = parseModelSpec(value);
      return {
        provider: spec.provider as SupportedProvider,
        model: spec.model
      };
    }
    
    // Fall back to default provider and model
    return {
      provider: this.defaultProvider,
      model: this.defaultModel
    };
  }

  private getEnvVariable(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Environment variable ${key} is required but not set.`);
    }
    return value;
  }

  private getOptionalEnvVariable(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }
  
  public getApiKeyForProvider(provider: SupportedProvider): string {
    switch (provider) {
      case 'openai':
        return this.openAIApiKey;
      case 'anthropic':
        return this.anthropicApiKey;
      case 'google':
        return this.googleApiKey;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }
  
  /**
   * Gets the OpenAI model to use for agents that require web search
   * Falls back to a default if not specified
   */
  public getOpenAIModelForWebSearchAgent(agentType: 'critic' | 'competitor'): string {
    // Check if the agent is already configured to use OpenAI
    const modelSpec = agentType === 'critic' 
      ? this.criticModelSpec 
      : this.competitorModelSpec;
    
    if (modelSpec.provider === 'openai') {
      return modelSpec.model;
    }
    
    // Fall back to OpenAI model for web search
    // Try to use a configured OpenAI model or default
    const fallbackModel = process.env.OPENAI_FALLBACK_MODEL || 'gpt-5-mini-2025-08-07';
    
    console.warn(
      `[Config Service] ${agentType} agent configured with ${modelSpec.provider}/${modelSpec.model} ` +
      `but web search requires OpenAI. Using fallback: ${fallbackModel}`
    );
    
    return fallbackModel;
  }
  
  /**
   * Checks if web search agents can run with current configuration
   */
  public validateWebSearchConfiguration(): void {
    if (this.enableWebSearch && !this.openAIApiKey) {
      throw new Error(
        'Web search is enabled but OpenAI API key is not configured. ' +
        'Either disable web search (ENABLE_WEB_SEARCH=false) or provide OPENAI_API_KEY.'
      );
    }
  }
}

export const configService = new ConfigService();