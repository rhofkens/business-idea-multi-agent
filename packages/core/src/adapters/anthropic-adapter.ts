import { anthropic } from '@ai-sdk/anthropic';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { ProviderAdapter } from '../types/provider-types.js';

export class AnthropicAdapter implements ProviderAdapter {
  createModel(modelId: string, apiKey: string): LanguageModelV2 {
    // For v5 SDK, the anthropic provider is configured globally
    // and the model is created by calling anthropic(modelId)
    // The apiKey should be set via ANTHROPIC_API_KEY env var
    if (apiKey && process.env.ANTHROPIC_API_KEY !== apiKey) {
      process.env.ANTHROPIC_API_KEY = apiKey;
    }
    return anthropic(modelId) as LanguageModelV2;
  }
  
  supportsWebSearch(): boolean {
    return true;
  }
}