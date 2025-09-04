import { createOpenAI } from '@ai-sdk/openai';
import { webSearchTool } from '@openai/agents';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { ProviderAdapter } from '../types/provider-types.js';

export class OpenAIAdapter implements ProviderAdapter {
  createModel(modelId: string, apiKey: string): LanguageModelV2 {
    const openai = createOpenAI({
      apiKey
    });
    return openai(modelId) as LanguageModelV2;
  }
  
  getWebSearchTool() {
    return webSearchTool();
  }
  
  supportsWebSearch(): boolean {
    return true;
  }
}