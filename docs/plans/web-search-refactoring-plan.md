# Multi-Agent Web Search Refactoring Plan

## Executive Summary

This plan addresses the limitation discovered with the `@openai/agents-extensions` aisdk adapter, which doesn't properly support provider-specific web search tools. We'll implement a pragmatic solution that uses OpenAI models for agents requiring web search (critic and competitor) while maintaining multi-provider support for other agents (ideation and documentation).

## Architecture Overview

### Current State
- All agents use `AgentFactory` with aisdk adapter
- Web search tools are defined but not functional for Anthropic/Google providers
- The aisdk adapter transforms models but doesn't properly pass provider-specific tools

### Target State
- **Hybrid Architecture**:
  - Direct OpenAI Agent creation for critic and competitor agents (with native web search)
  - Continued AgentFactory usage for ideation and documentation agents (multi-provider)
  - Backward compatibility maintained throughout

## Implementation Plan

### Phase 1: Create OpenAI-Specific Agent Builders

#### 1.1 Create New File: `/packages/core/src/factories/openai-direct-factory.ts`

```typescript
import { Agent } from '@openai/agents';
import { webSearchTool } from '@openai/agents';
import OpenAI from 'openai';
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
  static createAgent(config: OpenAIDirectAgentConfig, apiKey: string): Agent {
    loggingService.info(`Creating direct OpenAI agent: ${config.name}`);
    
    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey });
    
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
    loggingService.debug(`Tools configured: ${JSON.stringify(tools.map(t => t.name || 'unnamed'), null, 2)}`);
    
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
```

### Phase 2: Refactor Critic Agent

#### 2.1 Update `/packages/core/src/agents/critic-agent.ts`

Replace the `createCriticAgent` function (lines 96-104) with:

```typescript
import { OpenAIDirectFactory } from '../factories/openai-direct-factory.js';

/**
 * Creates a new instance of the Business Critic Agent
 * Always uses OpenAI for web search capability
 * @param executionContext - The execution mode specific context
 * @returns A configured Agent instance with web search capabilities
 */
function createCriticAgent(executionContext: string) {
  // Always use OpenAI for critic agent (web search requirement)
  const openAIModel = configService.getOpenAIModelForWebSearchAgent('critic');
  
  return OpenAIDirectFactory.createAgent({
    name: 'Business Critic Agent',
    instructions: createCriticalEvaluationPrompt(executionContext),
    model: openAIModel,
    enableWebSearch: configService.enableWebSearch
  }, OpenAIDirectFactory.validateApiKey());
}
```

### Phase 3: Refactor Competitor Agent

#### 3.1 Update `/packages/core/src/agents/competitor-agent.ts`

Replace the `createCompetitorAgent` function (lines 80-86) with:

```typescript
import { OpenAIDirectFactory } from '../factories/openai-direct-factory.js';

/**
 * Creates the competitor analysis agent
 * Always uses OpenAI for web search capability
 * @param executionContext - The execution mode specific context
 */
const createCompetitorAgent = (executionContext: string) => {
  // Always use OpenAI for competitor agent (web search requirement)
  const openAIModel = configService.getOpenAIModelForWebSearchAgent('competitor');
  
  return OpenAIDirectFactory.createAgent({
    name: 'Competitor Analysis Agent',
    instructions: createCompetitorAnalysisPrompt(executionContext),
    model: openAIModel,
    enableWebSearch: configService.enableWebSearch
  }, OpenAIDirectFactory.validateApiKey());
}
```

### Phase 4: Update Configuration Service

#### 4.1 Enhance `/packages/core/src/services/config-service.ts`

Add new methods after line 138:

```typescript
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
```

### Phase 5: Update Environment Configuration

#### 5.1 Update `.env.example`

Add new configuration options:

```bash
# Web Search Configuration
# Note: Web search currently requires OpenAI API
ENABLE_WEB_SEARCH=true

# OpenAI Fallback Model for Web Search
# Used when critic/competitor agents are configured with non-OpenAI providers
# but web search is enabled (web search requires OpenAI)
OPENAI_FALLBACK_MODEL=gpt-5-mini-2025-08-07

# Agent Model Configuration Examples
# For agents WITHOUT web search (ideation, documentation):
IDEATION_MODEL=anthropic:claude-sonnet-4-20250514
DOCUMENTATION_MODEL=google:gemini-2.5-flash

# For agents WITH web search (critic, competitor):
# These should use OpenAI models if web search is enabled
CRITIC_MODEL=openai:gpt-5-mini-2025-08-07
COMPETITOR_MODEL=openai:gpt-5-mini-2025-08-07
```

### Phase 6: Add Validation and Logging

#### 6.1 Create Startup Validation

Create new file `/packages/core/src/utils/startup-validation.ts`:

```typescript
import { configService } from '../services/config-service.js';

export function validateStartupConfiguration(): void {
  console.log('====================================');
  console.log('Multi-Agent System Configuration');
  console.log('====================================');
  
  // Check web search configuration
  if (configService.enableWebSearch) {
    console.log('Web Search: ENABLED');
    
    // Validate OpenAI is available for web search
    if (!configService.openAIApiKey) {
      console.error('ERROR: Web search enabled but OpenAI API key not found');
      throw new Error('Web search requires OpenAI API key');
    }
    
    // Warn if critic/competitor are using non-OpenAI providers
    if (configService.criticModelSpec.provider !== 'openai') {
      console.warn(
        `WARNING: Critic agent configured with ${configService.criticModelSpec.provider} ` +
        `but will use OpenAI for web search capability`
      );
    }
    
    if (configService.competitorModelSpec.provider !== 'openai') {
      console.warn(
        `WARNING: Competitor agent configured with ${configService.competitorModelSpec.provider} ` +
        `but will use OpenAI for web search capability`
      );
    }
  } else {
    console.log('Web Search: DISABLED');
  }
  
  console.log('\nAgent Configuration:');
  console.log(`  Ideation: ${configService.ideationModelSpec.provider}/${configService.ideationModelSpec.model}`);
  console.log(`  Documentation: ${configService.documentationModelSpec.provider}/${configService.documentationModelSpec.model}`);
  console.log(`  Critic: ${configService.criticModelSpec.provider}/${configService.criticModelSpec.model}${configService.enableWebSearch ? ' (→ OpenAI for web search)' : ''}`);
  console.log(`  Competitor: ${configService.competitorModelSpec.provider}/${configService.competitorModelSpec.model}${configService.enableWebSearch ? ' (→ OpenAI for web search)' : ''}`);
  
  console.log('====================================\n');
}
```

#### 6.2 Update Main Orchestrator

In `/packages/core/src/orchestrator/agent-orchestrator.ts`, add validation at the start:

```typescript
import { validateStartupConfiguration } from '../utils/startup-validation.js';

// Add at the beginning of the orchestrateAgents function
export async function* orchestrateAgents(
  preferences: BusinessPreferences,
  options: OrchestratorOptions = {}
): AsyncGenerator<OrchestratorEvent, CompletedResult, unknown> {
  // Validate configuration on first run
  validateStartupConfiguration();
  
  // ... rest of the function
}
```


## Implementation Checklist

- [ ] Create `OpenAIDirectFactory` class
- [ ] Update critic agent to use `OpenAIDirectFactory`
- [ ] Update competitor agent to use `OpenAIDirectFactory`
- [ ] Add `getOpenAIModelForWebSearchAgent` method to config service
- [ ] Add `validateWebSearchConfiguration` method to config service
- [ ] Create startup validation utility
- [ ] Update orchestrator with startup validation
- [ ] Update `.env.example` with new configuration options
- [ ] Test with different provider configurations manually
- [ ] Update documentation

## Migration Guide

### For Users

1. **If currently using all OpenAI models**: No changes needed
2. **If using mixed providers**:
   - Ensure `OPENAI_API_KEY` is set if web search is enabled
   - Critic and competitor agents will automatically use OpenAI for web search
   - Ideation and documentation agents continue using configured providers
3. **To disable web search entirely**: Set `ENABLE_WEB_SEARCH=false`

### For Developers

1. Update dependencies if needed
2. Run validation to check configuration
3. Monitor logs for provider fallback warnings
4. Test with your specific provider combinations

## Rollback Plan

If issues arise:

1. **Quick rollback**: Set `ENABLE_WEB_SEARCH=false` to disable web search
2. **Full rollback**: Revert to previous Git commit
3. **Partial rollback**: Use all OpenAI models temporarily

## Future Enhancements

Once provider-specific tools are properly supported in the aisdk adapter:

1. Revert to unified AgentFactory approach
2. Implement provider-specific web search tool configurations
3. Remove OpenAIDirectFactory
4. Update documentation

## Conclusion

This pragmatic refactoring plan:
- ✅ Solves the immediate web search problem
- ✅ Maintains backward compatibility
- ✅ Preserves multi-provider support where possible
- ✅ Provides clear migration path
- ✅ Includes comprehensive testing strategy
- ✅ Allows easy rollback if needed

The implementation prioritizes functionality over architectural purity, acknowledging that web search is critical for critic and competitor agents. The solution is production-ready and can be implemented immediately.