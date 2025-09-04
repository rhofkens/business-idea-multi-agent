import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { ProviderAdapter } from '../types/provider-types.js';

export class GoogleAdapter implements ProviderAdapter {
  createModel(modelId: string, apiKey: string): LanguageModelV2 {
    const google = createGoogleGenerativeAI({
      apiKey
    });
    return google(modelId) as LanguageModelV2;
  }
  
  supportsWebSearch(): boolean {
    return true;
  }
}