# Web Search Tool Implementation Plan Using Hosted Tools

## Executive Summary

This plan outlines the implementation of web search functionality for multi-provider agents using the OpenAI Agents SDK's `hosted_tool` mechanism. The solution leverages existing adapter infrastructure to enable provider-specific web search tools (Anthropic, Google, OpenAI) without custom model wrapping.

## Problem Statement

Current implementation attempts to attach Vercel AI SDK tools to the adapted model instance, which fails because:
1. The `aisdk` adapter doesn't recognize custom properties on the model
2. Tools are not being passed through the proper channel (ModelRequest)
3. Provider-specific web search tools are not being invoked

## Solution Architecture

### Core Insight
The `aisdk` adapter already supports provider-specific tools through the `hosted_tool` type, which it transforms into `provider-defined` tools that the Vercel AI SDK understands.

### Key Components
1. **AgentFactory**: Creates agents with provider-specific hosted tools
2. **Provider Adapters**: Supply provider-specific tool configurations
3. **OpenAI Agents SDK**: Passes tools via ModelRequest
4. **aisdk Adapter**: Transforms hosted_tool → provider-defined

## Implementation Tasks

### Phase 1: Refactor AgentFactory (Priority: HIGH)

#### Task 1.1: Remove Invalid Tool Attachment Logic
**File**: `packages/core/src/factories/agent-factory.ts`

**Current Code to Remove**:
```typescript
// Lines 64-65: Remove this invalid approach
(adaptedModel as any).__vercelTools = vercelTools;
```

**Also Remove**:
- The `vercelTools` object construction (lines 40-57)
- The comment about storing tools metadata (line 64)

#### Task 1.2: Implement Hosted Tool Creation
**File**: `packages/core/src/factories/agent-factory.ts`

**Add New Function**:
```typescript
private static createHostedWebSearchTool(provider: SupportedProvider, adapter: ProviderAdapter): Tool | null {
  if (!adapter.supportsWebSearch()) {
    return null;
  }

  switch (provider) {
    case 'openai':
      // OpenAI uses the standard webSearchTool from @openai/agents
      return adapter.getWebSearchTool() as Tool;
    
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
```

#### Task 1.3: Update Agent Creation Logic
**File**: `packages/core/src/factories/agent-factory.ts`

**Replace lines 39-73 with**:
```typescript
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
```

### Phase 2: Update Provider Adapters (Priority: MEDIUM)

#### Task 2.1: Update OpenAI Adapter
**File**: `packages/core/src/adapters/openai-adapter.ts`

The OpenAI adapter already returns `webSearchTool()` which is correct for native OpenAI usage. No changes needed.

#### Task 2.2: Remove Incorrect Web Search Tool Methods
**Files**: 
- `packages/core/src/adapters/anthropic-adapter.ts`
- `packages/core/src/adapters/google-adapter.ts`

**Remove the `getWebSearchTool()` methods** from these adapters as they return Vercel AI SDK tools, not OpenAI Agents tools. The hosted_tool approach handles this differently.

**Keep the `supportsWebSearch()` method** returning `true`.

### Phase 3: Type Definitions Update (Priority: HIGH)

#### Task 3.1: Add Hosted Tool Type
**File**: `packages/core/src/types/agent-types.ts` (or create if doesn't exist)

**Add**:
```typescript
import type { Tool } from '@openai/agents';

// Extend the Tool type to include hosted_tool variant
export interface HostedTool extends Tool {
  type: 'hosted_tool';
  name: string;
  providerData?: {
    args?: Record<string, any>;
  };
}
```

### Phase 4: Update Existing Agents (Priority: HIGH)

#### Task 4.1: Update Competitor Agent
**File**: `packages/core/src/agents/competitor-agent.ts`

Ensure the agent is created through the AgentFactory with `enableWebSearch: true`:
```typescript
const competitorAgent = AgentFactory.createAgent({
  name: 'Competitor Agent',
  instructions: systemPrompt,
  provider: configService.competitorModelSpec.provider,
  model: configService.competitorModelSpec.model,
  enableWebSearch: true  // This enables web search for competitive analysis
}, apiKey);
```

### Phase 5: Testing Strategy

#### Task 5.1: Create Test Script
**File**: `packages/core/test/test-web-search.ts`

```typescript
import { AgentFactory } from '../src/factories/agent-factory.js';
import { run } from '@openai/agents';

async function testWebSearch() {
  // Test Anthropic
  console.log('Testing Anthropic web search...');
  const anthropicAgent = AgentFactory.createAgent({
    name: 'Test Agent',
    instructions: 'You are a helpful assistant that can search the web.',
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-latest',
    enableWebSearch: true
  }, process.env.ANTHROPIC_API_KEY!);

  const result = await run(anthropicAgent, 'What is the latest news about TypeScript 5.5?');
  console.log('Anthropic result:', result);
  
  // Verify tool calls were made
  const toolCalls = result.messages.filter(m => m.role === 'tool');
  console.log(`Tool calls made: ${toolCalls.length}`);
}
```

## Implementation Checklist

- [ ] Remove `__vercelTools` attachment logic from AgentFactory
- [ ] Implement `createHostedWebSearchTool()` method
- [ ] Update Agent creation to pass tools array
- [ ] Remove Vercel AI SDK tool methods from Anthropic/Google adapters
- [ ] Add HostedTool type definition
- [ ] Update competitor-agent.ts to use AgentFactory properly
- [ ] Create and run test script
- [ ] Verify web search works for all three providers
- [ ] Verify competitor agent returns hyperlinks
- [ ] Verify critic agent JSON parsing is robust

## Success Criteria

1. **Anthropic agents** successfully make web search tool calls using `webSearch_20250305`
2. **Google agents** successfully make web search tool calls using `google_search`
3. **OpenAI agents** continue to work with native `webSearchTool`
4. **Competitor agent** returns analysis with hyperlinks to competitor websites
5. **No TypeScript errors** during compilation
6. **Clean separation** between OpenAI Agents tools and Vercel AI SDK tools

## Risk Mitigation

1. **Backward Compatibility**: Ensure existing agents without web search continue to work
2. **Provider Variations**: Test with different model versions (e.g., claude-3-opus vs sonnet)
3. **Error Handling**: Add try-catch blocks around tool creation
4. **Logging**: Add comprehensive logging for debugging tool invocation

## Notes for Implementation

1. The `hosted_tool` type is not well-documented but exists in the aisdk adapter source code
2. Tool names must match exactly what each provider expects
3. The `providerData.args` object should contain provider-specific configuration
4. Test incrementally - verify each provider works before moving to the next
5. Keep the OpenAI adapter's native `webSearchTool()` as it works differently

## Expected Outcome

After implementation, the flow will be:
1. AgentFactory creates agents with hosted_tool entries in the tools array
2. When run() is called, tools are passed via ModelRequest
3. The aisdk adapter transforms hosted_tool → provider-defined
4. Vercel AI SDK recognizes and invokes the provider's web search
5. Results are returned and formatted by the agent

This approach leverages existing infrastructure without fighting the framework's design.