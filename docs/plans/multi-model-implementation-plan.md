# Comprehensive Implementation Plan for Multi-Model LLM Support

## Executive Summary

This document provides a detailed, step-by-step implementation plan for adding multi-model LLM support to the business idea multi-agent system. The plan follows the agent factory pattern as described in the research document and enables support for multiple providers (OpenAI, Anthropic, Google) with specific model configurations. **This is a POC implementation with all testing performed manually - no automated testing will be implemented.**

## Architecture Overview

The implementation will follow a three-layer architecture:
1. **Agent Factory Layer**: Dynamic agent creation with provider-specific configurations
2. **Provider Adapter Layer**: Abstraction for different LLM providers using Vercel AI SDK
3. **Configuration Layer**: Environment-based provider and model selection

## Phase 1: Core Infrastructure Setup

### Step 1.1: Install Required Dependencies

**File**: `/Users/roelandhofkens/Projects/Ai/business-idea-multi-agent/packages/core/package.json`

**Action**: Update dependencies section to add:
```json
{
  "dependencies": {
    // ... existing dependencies ...
    "@openai/agents-extensions": "^0.0.10",
    "ai": "^3.4.33",
    "@ai-sdk/openai": "^1.0.14",
    "@ai-sdk/anthropic": "^1.0.12",
    "@ai-sdk/google": "^1.0.11"
  }
}
```

**Implementation**: Run `npm install` after updating package.json.

### Step 1.2: Update Environment Configuration Schema

**File**: `/Users/roelandhofkens/Projects/Ai/business-idea-multi-agent/.env.example`

**Action**: Replace existing content with:
```env
# Provider Configuration
LLM_PROVIDER="openai"              # Options: "openai", "anthropic", "google"
LLM_MODEL="gpt5-mini"              # Default model for selected provider

# Provider API Keys
OPENAI_API_KEY="your_openai_api_key_here"
ANTHROPIC_API_KEY="your_anthropic_api_key_here"
GOOGLE_API_KEY="your_google_api_key_here"

# Per-Agent Model Configuration (optional, format: provider:model)
# Leave commented to use global LLM_PROVIDER and LLM_MODEL
# IDEATION_MODEL="openai:gpt-5"
# COMPETITOR_MODEL="anthropic:claude-opus-4-1-20250805"
# CRITIC_MODEL="google:gemini-2.5-pro"
# DOCUMENTATION_MODEL="openai:o3"

# Feature Flags
USE_REFINEMENT="true"
ENABLE_WEB_SEARCH="true"

# Server Configuration
NODE_ENV="development"
PORT="3001"
SESSION_SECRET="your-session-secret-min-32-chars"
CORS_ORIGIN=""
```

## Phase 2: Core Components Implementation

### Step 2.1: Create Provider Types and Interfaces

**File**: `/Users/roelandhofkens/Projects/Ai/business-idea-multi-agent/packages/core/src/types/provider-types.ts` (NEW)

```typescript
import type { Agent } from '@openai/agents';
import type { LanguageModel } from 'ai';

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
  customTools?: any[];
}

// Model registry interface
export interface ModelRegistry {
  [key: string]: ModelConfig;
}

// Provider adapter interface
export interface ProviderAdapter {
  createModel(modelId: string, apiKey: string): LanguageModel;
  getWebSearchTool?(): any;
  supportsWebSearch(): boolean;
}
```

### Step 2.2: Create Model Registry

**File**: `/Users/roelandhofkens/Projects/Ai/business-idea-multi-agent/packages/core/src/config/model-registry.ts` (NEW)

```typescript
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
```

### Step 2.3: Create Provider Adapters

**File**: `/Users/roelandhofkens/Projects/Ai/business-idea-multi-agent/packages/core/src/adapters/openai-adapter.ts` (NEW)

```typescript
import { openai } from '@ai-sdk/openai';
import { webSearchTool } from '@openai/agents';
import type { LanguageModel } from 'ai';
import type { ProviderAdapter } from '../types/provider-types.js';

export class OpenAIAdapter implements ProviderAdapter {
  createModel(modelId: string, apiKey: string): LanguageModel {
    return openai(modelId, {
      apiKey
    });
  }
  
  getWebSearchTool() {
    return webSearchTool();
  }
  
  supportsWebSearch(): boolean {
    return true;
  }
}
```

**File**: `/Users/roelandhofkens/Projects/Ai/business-idea-multi-agent/packages/core/src/adapters/anthropic-adapter.ts` (NEW)

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai';
import type { ProviderAdapter } from '../types/provider-types.js';

export class AnthropicAdapter implements ProviderAdapter {
  createModel(modelId: string, apiKey: string): LanguageModel {
    return anthropic(modelId, {
      apiKey
    });
  }
  
  getWebSearchTool() {
    // Access the versioned web search tool
    return anthropic.tools.webSearch_20250305({
      maxUses: 15
    });
  }
  
  supportsWebSearch(): boolean {
    return true;
  }
}
```

**File**: `/Users/roelandhofkens/Projects/Ai/business-idea-multi-agent/packages/core/src/adapters/google-adapter.ts` (NEW)

```typescript
import { google } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';
import type { ProviderAdapter } from '../types/provider-types.js';

export class GoogleAdapter implements ProviderAdapter {
  createModel(modelId: string, apiKey: string): LanguageModel {
    return google(modelId, {
      apiKey
    });
  }
  
  getWebSearchTool() {
    // Google's search tool for Gemini 2.0+
    return google.tools.googleSearch({});
  }
  
  supportsWebSearch(): boolean {
    return true;
  }
}
```

### Step 2.4: Create Agent Factory

**File**: `/Users/roelandhofkens/Projects/Ai/business-idea-multi-agent/packages/core/src/factories/agent-factory.ts` (NEW)

```typescript
import { Agent } from '@openai/agents';
import { aisdk } from '@openai/agents-extensions';
import type { Tool } from '@openai/agents';
import type { LanguageModel } from 'ai';
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
    let nativeTools: Tool[] = [];
    let vercelTools: Record<string, any> = {};
    
    if (config.enableWebSearch && adapter.supportsWebSearch()) {
      if (config.provider === 'openai') {
        // OpenAI uses native tools from @openai/agents
        nativeTools.push(adapter.getWebSearchTool());
        loggingService.debug('Added OpenAI native web search tool');
      } else {
        // Anthropic and Google use Vercel AI SDK tools
        const webSearchTool = adapter.getWebSearchTool();
        if (webSearchTool) {
          if (config.provider === 'anthropic') {
            vercelTools['webSearch_20250305'] = webSearchTool;
            loggingService.debug('Added Anthropic web search tool');
          } else if (config.provider === 'google') {
            vercelTools['google_search'] = webSearchTool;
            loggingService.debug('Added Google search tool');
          }
        }
      }
    }
    
    // Add custom tools if provided
    if (config.customTools) {
      // Custom tools should be Vercel AI SDK compatible
      config.customTools.forEach((tool, index) => {
        vercelTools[`custom_tool_${index}`] = tool;
      });
    }
    
    // Wrap the model with the aisdk adapter
    const adaptedModel = aisdk(model, {
      tools: Object.keys(vercelTools).length > 0 ? vercelTools : undefined
    });
    
    // Create and return the agent
    const agent = new Agent({
      name: config.name,
      instructions: config.instructions,
      model: adaptedModel,
      tools: nativeTools
    });
    
    loggingService.info(`Agent "${config.name}" created successfully with provider ${config.provider}`);
    
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
```

### Step 2.5: Update Config Service

**File**: `/Users/roelandhofkens/Projects/Ai/business-idea-multi-agent/packages/core/src/services/config-service.ts`

**Action**: Replace entire file with:

```typescript
import dotenv from 'dotenv';
import { parseModelSpec } from '../config/model-registry.js';
import type { SupportedProvider } from '../types/provider-types.js';

dotenv.config();

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
    this.defaultModel = this.getOptionalEnvVariable('LLM_MODEL', 'gpt5-mini');
    
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
}

export const configService = new ConfigService();
```

## Phase 3: Agent Migration

### Step 3.1: Update Ideation Agent

**File**: `/Users/roelandhofkens/Projects/Ai/business-idea-multi-agent/packages/core/src/agents/ideation-agent.ts`

**Key Changes**:
1. Import `AgentFactory` instead of creating agents directly
2. Use factory pattern for agent creation
3. Pass provider-specific configuration

**Modified sections**:
```typescript
import { run } from '@openai/agents';
import { AgentFactory } from '../factories/agent-factory.js';

// In executeIdeationAgent function:
const ideationAgentInstance = AgentFactory.createAgent({
  name: 'Ideation Agent',
  instructions: createSystemPrompt(ideaIds, executionContext),
  provider: configService.ideationModelSpec.provider,
  model: configService.ideationModelSpec.model,
  enableWebSearch: false // Ideation doesn't use web search
}, configService.getApiKeyForProvider(configService.ideationModelSpec.provider));

const refinementAgentInstance = AgentFactory.createAgent({
  name: 'Refinement Agent',
  instructions: refinementPrompt,
  provider: configService.ideationModelSpec.provider,
  model: configService.ideationModelSpec.model,
  enableWebSearch: false
}, configService.getApiKeyForProvider(configService.ideationModelSpec.provider));
```

### Step 3.2: Update Competitor Agent

**File**: `/Users/roelandhofkens/Projects/Ai/business-idea-multi-agent/packages/core/src/agents/competitor-agent.ts`

**Key Changes**:
1. Remove direct `webSearchTool` import
2. Use `AgentFactory` for agent creation
3. Enable web search through factory configuration

**Modified sections**:
```typescript
import { run } from '@openai/agents';
import { AgentFactory } from '../factories/agent-factory.js';

// In analyzeCompetitor function:
const competitorAgent = AgentFactory.createAgent({
  name: 'Competitor Analysis Agent',
  instructions: createCompetitorAnalysisPrompt(executionContext),
  provider: configService.competitorModelSpec.provider,
  model: configService.competitorModelSpec.model,
  enableWebSearch: configService.enableWebSearch
}, configService.getApiKeyForProvider(configService.competitorModelSpec.provider));
```

### Step 3.3: Update Critic Agent

**File**: `/Users/roelandhofkens/Projects/Ai/business-idea-multi-agent/packages/core/src/agents/critic-agent.ts`

Similar changes as competitor agent - use factory pattern with web search enabled.

### Step 3.4: Update Documentation Agent

**File**: `/Users/roelandhofkens/Projects/Ai/business-idea-multi-agent/packages/core/src/agents/documentation-agent.ts`

Similar changes - use factory pattern, typically without web search.

## Phase 4: Error Handling and Fallback

### Step 4.1: Create Provider Fallback Service

**File**: `/Users/roelandhofkens/Projects/Ai/business-idea-multi-agent/packages/core/src/services/provider-fallback-service.ts` (NEW)

```typescript
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
      } catch (error) {
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
```

## Phase 5: Migration Strategy

### Step 5.1: Phased Migration Approach

1. **Phase 1 - Infrastructure** (Day 1):
   - Install dependencies
   - Create type definitions and interfaces
   - Implement provider adapters
   - Create agent factory

2. **Phase 2 - Configuration** (Day 1):
   - Update config service
   - Create model registry
   - Update environment files

3. **Phase 3 - Agent Migration** (Day 2):
   - Update each agent one by one
   - Test each agent individually
   - Maintain backward compatibility

4. **Phase 4 - Testing** (Day 2-3):
   - Manual testing with each provider
   - Test fallback scenarios
   - Verify web search functionality

### Step 5.2: Backward Compatibility

The implementation maintains backward compatibility by:
1. Supporting existing `OPENAI_API_KEY` environment variable
2. Defaulting to OpenAI provider when not specified
3. Maintaining legacy model property names in config service
4. Supporting existing agent interfaces

## Phase 6: Testing Strategy (Manual - POC)

### Manual Testing Checklist

#### 6.1 Provider Configuration Tests
- [ ] Test with only OpenAI API key configured
- [ ] Test with only Anthropic API key configured
- [ ] Test with only Google API key configured
- [ ] Test with multiple API keys configured
- [ ] Test invalid provider names
- [ ] Test invalid model names

#### 6.2 Model Selection Tests
- [ ] Test default model selection (gpt5-mini)
- [ ] Test each OpenAI model
- [ ] Test each Anthropic model
- [ ] Test each Google model
- [ ] Test provider:model format in environment variables

#### 6.3 Agent Functionality Tests
- [ ] Test ideation agent with each provider
- [ ] Test competitor agent with web search enabled
- [ ] Test critic agent with web search enabled
- [ ] Test documentation agent

#### 6.4 Fallback Tests
- [ ] Test fallback when primary provider fails
- [ ] Test fallback chain exhaustion
- [ ] Test rate limit handling

#### 6.5 Web Search Tests
- [ ] Test OpenAI web search
- [ ] Test Anthropic web search
- [ ] Test Google search
- [ ] Test with web search disabled

### Testing Commands

```bash
# Test with different providers
LLM_PROVIDER=openai npm run dev:cli
LLM_PROVIDER=anthropic npm run dev:cli
LLM_PROVIDER=google npm run dev:cli

# Test with specific models
IDEATION_MODEL="anthropic:claude-opus-4-1-20250805" npm run dev:cli
COMPETITOR_MODEL="google:gemini-2.5-pro" npm run dev:cli

# Test web search
ENABLE_WEB_SEARCH=true npm run dev:cli
ENABLE_WEB_SEARCH=false npm run dev:cli
```

## Phase 7: Monitoring and Observability

### Step 7.1: Enhanced Logging

**File**: `/Users/roelandhofkens/Projects/Ai/business-idea-multi-agent/packages/core/src/services/logging-service.ts`

Add provider-specific logging:
```typescript
logProviderUsage(provider: string, model: string, agent: string) {
  this.info(`Provider usage: ${provider}/${model} for ${agent}`);
}

logProviderError(provider: string, error: Error) {
  this.error(`Provider error [${provider}]: ${error.message}`, error);
}

logProviderFallback(from: string, to: string) {
  this.warn(`Provider fallback: ${from} -> ${to}`);
}
```

## Implementation Sequence

### Day 1 - Core Implementation
1. **Morning**:
   - Install dependencies
   - Create type definitions (`provider-types.ts`)
   - Create model registry (`model-registry.ts`)
   
2. **Afternoon**:
   - Implement provider adapters (OpenAI, Anthropic, Google)
   - Create agent factory
   - Update config service

### Day 2 - Agent Migration
1. **Morning**:
   - Update ideation agent
   - Update competitor agent
   - Manual test each agent
   
2. **Afternoon**:
   - Update critic agent
   - Update documentation agent
   - Create fallback service

### Day 3 - Testing and Refinement
1. **Full Day**:
   - Complete manual testing checklist
   - Fix any discovered issues
   - Document configuration examples
   - Update README with usage instructions

## Configuration Examples

### Example 1: All OpenAI (Default)
```env
LLM_PROVIDER="openai"
LLM_MODEL="gpt5-mini"
OPENAI_API_KEY="sk-..."
```

### Example 2: Mixed Providers
```env
LLM_PROVIDER="openai"
LLM_MODEL="gpt5-mini"

OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_API_KEY="AIza..."

IDEATION_MODEL="openai:gpt-5"
COMPETITOR_MODEL="anthropic:claude-opus-4-1-20250805"
CRITIC_MODEL="google:gemini-2.5-pro"
DOCUMENTATION_MODEL="openai:o3"
```

### Example 3: All Anthropic
```env
LLM_PROVIDER="anthropic"
LLM_MODEL="claude-opus-4-1-20250805"
ANTHROPIC_API_KEY="sk-ant-..."
```

## Risk Mitigation

1. **API Key Security**: Store keys in environment variables only
2. **Rate Limiting**: Implement exponential backoff in fallback service
3. **Cost Management**: Log token usage per provider
4. **Version Compatibility**: Pin SDK versions in package.json
5. **Backward Compatibility**: Maintain existing interfaces

## Success Criteria

The implementation is successful when:
1. ✅ All agents can use any configured provider
2. ✅ Web search works for all supported providers
3. ✅ Fallback mechanism activates on provider failure
4. ✅ Configuration is entirely environment-based
5. ✅ Existing functionality remains unchanged
6. ✅ Manual testing checklist is complete

## Conclusion

This implementation plan provides a comprehensive, step-by-step approach to adding multi-model LLM support to the business idea multi-agent system. The plan follows the agent factory pattern, ensures backward compatibility, and includes detailed testing procedures. The modular architecture allows for easy addition of new providers in the future while maintaining a clean separation of concerns.

The implementation prioritizes:
- **Flexibility**: Support for multiple providers and models
- **Maintainability**: Clear separation of concerns and modular design
- **Reliability**: Fallback mechanisms and error handling
- **Simplicity**: Environment-based configuration
- **Compatibility**: Preserves existing functionality

This POC implementation focuses on core functionality with manual testing, allowing for rapid iteration and validation before considering automated testing in a future production implementation.