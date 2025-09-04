import type { LanguageModelV2 } from '@ai-sdk/provider';

// Supported LLM Providers
export type SupportedProvider = 'openai' | 'anthropic' | 'google';

// Model configurations with aliases
export interface ModelConfig {
  id: string;
  alias?: string;
  provider: SupportedProvider;
}

// Provider configuration for agent creation
export interface ProviderConfig {
  provider: SupportedProvider;
  model: string;
  apiKey: string;
}

// Agent factory configuration
export interface AgentFactoryConfig {
  name: string;
  instructions: string;
  provider: SupportedProvider;
  model: string;
  enableWebSearch?: boolean;
  customTools?: unknown[];
}

// Model registry interface
export interface ModelRegistry {
  [key: string]: ModelConfig;
}

// Provider adapter interface
export interface ProviderAdapter {
  createModel(modelId: string, apiKey: string): LanguageModelV2;
  getWebSearchTool?(): unknown;
  supportsWebSearch(): boolean;
}