import type { SupportedProvider } from '../types/provider-types.js';
import { configService } from './config-service.js';
import { loggingService } from './logging-service.js';

export class ProviderFallbackService {
  private static fallbackChain: SupportedProvider[] = ['openai', 'anthropic', 'google'];
  
  /**
   * Get next available provider in fallback chain
   */
  static getNextProvider(currentProvider: SupportedProvider): SupportedProvider | null {
    const currentIndex = this.fallbackChain.indexOf(currentProvider);
    
    for (let i = currentIndex + 1; i < this.fallbackChain.length; i++) {
      const provider = this.fallbackChain[i];
      
      // Check if API key is available for this provider
      try {
        const apiKey = configService.getApiKeyForProvider(provider);
        if (apiKey) {
          loggingService.info(`Falling back to provider: ${provider}`);
          return provider;
        }
      } catch (_error) {
        // Provider not configured, continue to next
        continue;
      }
    }
    
    return null;
  }
  
  /**
   * Execute with automatic fallback on failure
   */
  static async executeWithFallback<T>(
    primaryProvider: SupportedProvider,
    executeFn: (provider: SupportedProvider) => Promise<T>
  ): Promise<T> {
    let currentProvider: SupportedProvider | null = primaryProvider;
    let lastError: Error | null = null;
    
    while (currentProvider) {
      try {
        return await executeFn(currentProvider);
      } catch (error) {
        lastError = error as Error;
        loggingService.error(`Provider ${currentProvider} failed: ${lastError.message}`);
        
        currentProvider = this.getNextProvider(currentProvider);
        if (!currentProvider) {
          break;
        }
      }
    }
    
    throw new Error(`All providers failed. Last error: ${lastError?.message}`);
  }
}