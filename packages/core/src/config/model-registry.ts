import { ModelRegistry, ModelConfig } from '../types/provider-types.js';

export const MODEL_REGISTRY: ModelRegistry = {
  // OpenAI Models (default provider)
  'gpt-5-mini-2025-08-07': {
    id: 'gpt-5-mini-2025-08-07',
    provider: 'openai'
  },
  'gpt-5-2025-08-07': {
    id: 'gpt-5-2025-08-07',
    provider: 'openai'
  },
  'o3': {
    id: 'o3',
    provider: 'openai'
  },
  'gpt-4.1': {
    id: 'gpt-4.1',
    provider: 'openai'
  },
  'gpt-4o': {
    id: 'gpt-4o',
    provider: 'openai'
  },
  
  // Anthropic Models
  'claude-opus-4-1-20250805': {
    id: 'claude-opus-4-1-20250805',
    alias: 'Claude Opus 4.1',
    provider: 'anthropic'
  },
  'claude-sonnet-4-20250514': {
    id: 'claude-sonnet-4-20250514',
    alias: 'Claude Sonnet 4',
    provider: 'anthropic'
  },
  
  // Google Models
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    alias: 'Gemini 2.5 Flash',
    provider: 'google'
  },
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro',
    alias: 'Gemini 2.5 Pro',
    provider: 'google'
  }
};

// Helper function to parse model specification
export function parseModelSpec(spec: string): { provider: string; model: string } {
  // Handle provider:model format
  if (spec.includes(':')) {
    const [provider, model] = spec.split(':');
    return { provider, model };
  }
  
  // Look up in registry
  const config = MODEL_REGISTRY[spec];
  if (config) {
    return { provider: config.provider, model: config.id };
  }
  
  // Default to OpenAI provider if not found
  return { provider: 'openai', model: spec };
}

// Get model configuration
export function getModelConfig(modelId: string): ModelConfig | undefined {
  return MODEL_REGISTRY[modelId];
}