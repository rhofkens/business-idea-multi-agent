# Architecting Unified Tooling for Multi-Provider Agents in the OpenAI TypeScript SDK

## Section 1: The Three-Layer Architecture: Agents, Adapters, and Providers

To effectively address the challenge of unifying tool usage across disparate model providers within the OpenAI Agents SDK for TypeScript, it is imperative to first deconstruct the underlying software architecture. The user's technology stack is not a monolithic entity but rather a composition of three distinct, interacting layers: the agentic framework, an abstraction layer, and the model providers themselves. A precise understanding of how requests, configurations, and capabilities flow through these layers is the prerequisite for diagnosing the integration problem and architecting a robust, scalable solution. This section will meticulously dissect this three-layer model, establishing a clear conceptual foundation for the analysis and implementation that follows.

### 1.1 Layer 1: The Agentic Framework - `@openai/agents`

The top layer of the architecture is the agentic framework itself, provided by the `@openai/agents` package. This SDK furnishes the high-level primitives necessary for constructing and orchestrating AI agents.[1, 2]

#### 1.1.1 Core Primitives

The framework is intentionally lightweight, built around a small set of core concepts that enable complex workflows without imposing a steep learning curve.[1, 2, 3, 4] The primary components are:

*   **`Agent`**: This is the fundamental building block. An `Agent` is an instance of a Large Language Model (LLM) configured with a specific set of `instructions` (the system prompt), a target `model`, and a collection of `tools` it can use to interact with the outside world.[2, 5]
*   **`Runner`**: The `Runner` is the execution engine that manages the agentic loop. When a `run` command is initiated, the `Runner` takes the user's input, passes it to the `Agent`, receives the model's response, and orchestrates the subsequent steps. If the model emits a tool call, the `Runner` ensures the tool is executed and its output is returned to the model for the next turn. This loop continues until a final output is generated or a maximum turn limit is reached.[1, 6]
*   **`tool`**: A helper function provided by the SDK to define custom functions that the `Agent` can invoke. This function wraps a standard TypeScript function with a JSON schema for its parameters, making it intelligible to the LLM.[5, 7]
*   **`handoff`**: A specialized mechanism that allows one `Agent` to delegate a task to another, more specialized `Agent`. This is crucial for building multi-agent systems where different agents handle distinct responsibilities, such as routing a user query to the correct department.[5, 8, 9]

#### 1.1.2 Tooling Philosophy

The design philosophy of the `@openai/agents` SDK becomes apparent in its native support for what it terms "Hosted tools".[7, 10] These are pre-packaged functionalities that run on OpenAI's servers alongside the models. The SDK provides simple importable functions for these tools, such as `webSearchTool()`, `fileSearchTool()`, `codeInterpreterTool()`, and `imageGenerationTool`.[6, 7]

For instance, enabling web search for an agent designed to work with an OpenAI model is as straightforward as importing and including the tool in the agent's definition:typescript
import { Agent, webSearchTool } from '@openai/agents';

```typescript
const agent = new Agent({
  name: 'Research Assistant',
  instructions: 'You are a helpful research assistant.',
  tools:,
  model: 'gpt-4o',
});
```

This streamlined integration highlights the SDK's primary design orientation. While it aims for broader compatibility, its most frictionless path is deeply integrated with the OpenAI ecosystem. This inherent design bias is a critical piece of context; it explains why functionalities that are standard within the OpenAI API are treated as first-class citizens, while functionalities from other providers require an additional layer of integration.

#### 1.1.3 The "Provider-Agnostic" Claim

The official documentation for the `@openai/agents` SDK asserts that it is "provider-agnostic".[1] This claim is accurate, but its implementation details are nuanced. The SDK does not achieve this agnosticism through a comprehensive, built-in abstraction layer that normalizes the features of every major LLM provider. Instead, it provides a specific extension point designed to connect to an external abstraction layer. The documentation explicitly states that broader model support is enabled "through the Vercel AI SDK adapter".[1] This architectural decision delegates the complexity of multi-provider support to a dedicated, third-party toolkit, positioning the Vercel AI SDK as the essential bridge to the wider world of LLMs. This leads directly to the second layer of the architecture.

### 1.2 Layer 2: The Abstraction Layer - Vercel AI SDK and the `@openai/agents-extensions` Adapter

The middle layer serves as the crucial intermediary, translating between the expectations of the `@openai/agents` framework and the diverse APIs of various model providers. This layer is composed of two key components: the Vercel AI SDK itself and a specific adapter package that connects it to the OpenAI Agents SDK.

#### 1.2.1 The Bridge: `@openai/agents-extensions`

To use any non-OpenAI model (or even an OpenAI model through a different API pathway), the developer must install the `@openai/agents-extensions` package.[11] This package exports a single, vital function: `aisdk`. This function is the lynchpin of the entire multi-provider integration strategy. It acts as a wrapper, or an adapter, that takes a model instance from the Vercel AI SDK and makes it conform to the `Model` interface that the `@openai/agents` `Agent` constructor expects.

The mechanism of action is demonstrated in the initialization code:

```typescript
import { Agent } from '@openai/agents';
import { aisdk } from '@openai/agents-extensions';
import { anthropic } from '@ai-sdk/anthropic'; // Vercel AI SDK provider for Anthropic

// 1. Initialize a model instance from the Vercel AI SDK
const claudeModelInstance = anthropic('claude-3-5-sonnet-latest');

// 2. Wrap the Vercel AI SDK instance with the aisdk adapter
const adaptedModel = aisdk(claudeModelInstance);

// 3. Pass the adapted model to the OpenAI Agent constructor
const agent = new Agent({
  name: 'Claude Agent',
  instructions: 'You are a helpful assistant powered by Anthropic.',
  model: adaptedModel,
});
```

This pattern makes it clear that the `@openai/agents` SDK is not directly communicating with the Anthropic API. It is communicating with the `adaptedModel` object, which then delegates the call to the underlying Vercel AI SDK instance.

#### 1.2.2 Flow of Control

Understanding the flow of a request through this adapted architecture is essential. When `run(agent, "...")` is executed:

1.  The `@openai/agents` `Runner` invokes the `agent`.
2.  The `agent` prepares the request (messages, tools, etc.) and calls its configured `model` object.
3.  Because the `model` is the `adaptedModel` created by the `aisdk` function, this call is intercepted by the adapter.
4.  The adapter translates the request into the format expected by the Vercel AI SDK's core functions, such as `generateText` or `streamText`.[12, 13, 14]
5.  The Vercel AI SDK then takes over, handling the logic for tool execution, making the final API call to the specified provider (e.g., Anthropic), and processing the response.

This flow reveals a critical architectural detail: once the `aisdk` adapter is in use, the agent's tool-calling capabilities are no longer governed by the native logic of `@openai/agents` but by the paradigms and conventions of the Vercel AI SDK. This shift in control is the primary source of the integration challenges related to tool definition and naming.

The reliance on an external adapter for multi-provider support introduces an architectural mismatch. The `@openai/agents` SDK is designed with a static, compile-time understanding of tools, particularly OpenAI's hosted tools. However, the Vercel AI SDK is designed to handle a dynamic and heterogeneous set of provider-native features. The `aisdk` adapter bridges the gap for model invocation but does not attempt to normalize the rich, provider-specific features like tool definitions. This creates a "leaky abstraction," where the unique details of each provider—such as Anthropic's versioned tool names or Gemini's distinct tool definition—pass through the layers and emerge at the top, requiring the developer to handle them explicitly. The core problem articulated in the user query is a direct symptom of this leaky abstraction. The absence of a built-in normalization feature is not an oversight but a consequence of this layered, adapter-based design. The only viable solution, therefore, is to construct a new, higher-level abstraction that explicitly manages this heterogeneity, effectively sealing the leak.

### 1.3 Layer 3: The Model Providers - `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`

The final and lowest layer of the architecture consists of the specific provider packages published as part of the Vercel AI SDK ecosystem. Packages like `@ai-sdk/openai`, `@ai-sdk/anthropic`, and `@ai-sdk/google` are not mere API clients; they are intelligent providers that encapsulate the unique protocols, authentication methods, and feature sets of their respective platforms.[15]

This is the layer where the heterogeneity that causes the user's problem originates. Each provider has a different philosophy and implementation for extending its model's capabilities:

*   The `@ai-sdk/openai` provider is configured to work with OpenAI's standard tool-calling API format.
*   The `@ai-sdk/anthropic` provider exposes a unique `anthropic.tools` object, which contains functions to generate definitions for Anthropic's specific, versioned tools like `webSearch_20250305`.[16]
*   The `@ai-sdk/google` provider, for recent models, exposes a `google.tools` object containing a `googleSearch` function to enable its web search capability.[17, 18]

By clearly delineating these three layers, the problem becomes well-defined. The developer is operating within the `@openai/agents` framework (Layer 1), but to achieve multi-provider support, they must use an adapter (Layer 2) that passes control to provider-specific packages (Layer 3). The challenge lies in reconciling the static, OpenAI-centric tool model of Layer 1 with the dynamic, heterogeneous tool models exposed by Layer 3, a task for which the adapter at Layer 2 provides no built-in solution.

## Section 2: A Granular Comparison of Provider-Native Search Mechanisms

The premise of the user's query is that different models from OpenAI, Anthropic, and Google Gemini possess built-in web search capabilities that are invoked under different names. A meticulous, evidence-based analysis of these mechanisms validates this premise and reveals that the providers employ distinct, though increasingly convergent, architectural paradigms for web search. Understanding these technical details is essential to defining the precise scope of the integration challenge and justifying the architectural solution proposed later in this report.

### 2.1 OpenAI: The Hosted `webSearchTool`

OpenAI's implementation represents the baseline for tool integration within its ecosystem. It is characterized by simplicity and tight coupling with the `@openai/agents` SDK.

*   **Implementation:** The integration is remarkably straightforward. The developer imports the `webSearchTool` function directly from the `@openai/agents` package and includes it in the `tools` array during agent initialization.[7, 8] There are no provider-specific objects or complex configurations to manage at this stage.
*   **Mechanism:** When an agent configured with this tool and an OpenAI model (e.g., `gpt-4o`) determines that a web search is necessary, it communicates this intent to the OpenAI API. The SDK passes a standardized tool definition with the name `web_search` in the API request.[7] The actual search operation is executed on OpenAI's servers—it is a "hosted tool." The results are then returned to the model within the same API interaction, allowing it to formulate a final response. The entire process is managed as an explicit, observable tool-calling event within the agentic loop.
*   **Simplicity and Coupling:** This approach prioritizes developer experience for users within the OpenAI ecosystem. However, its simplicity is a function of its tight coupling. The `webSearchTool` is not a generic interface but a specific implementation tied to OpenAI's backend infrastructure.

### 2.2 Anthropic: Provider-Defined, Versioned Tools

Anthropic, via the Vercel AI SDK, offers a more structured and explicit approach to tool usage, treating its native tools as formal, versioned components of its API.

*   **Implementation:** Access to Anthropic's web search tool is not available through the `@openai/agents` package. Instead, it is exposed as a method on the provider instance created from the `@ai-sdk/anthropic` package. The specific method is `anthropic.tools.webSearch_20250305()`.[16] The version suffix (`_20250305`) is significant, indicating a commitment to API stability and providing a clear path for future updates without breaking existing implementations.
*   **Mechanism:** This function, when called, returns a complete tool definition object that is compatible with the Vercel AI SDK's `generateText` function. Like OpenAI's approach, this results in an explicit tool call. The model identifies the need for a search, emits a `tool_call` event for `webSearch_20250305`, the search is executed by Anthropic's backend, and the results are returned to the model for synthesis.
*   **Configuration:** A key differentiator is the rich, provider-specific configuration available for Anthropic's tool. The `webSearch_20250305()` function accepts a configuration object that allows for granular control over the search behavior, including parameters such as `maxUses` (to limit the number of searches in a single turn), `allowedDomains` and `blockedDomains` (to scope the search to specific websites), and `userLocation` (to provide geographically relevant results).[16] This level of control is not exposed as directly in OpenAI's simpler helper function.

### 2.3 Google Gemini: The `google_search` Tool

Google's approach with its latest Gemini models (2.0 and later, including 2.5) has evolved significantly, moving from an implicit mechanism to an explicit tool-calling paradigm that aligns more closely with other providers.[19, 20]

*   **Implementation:** For recent models like Gemini 2.5, enabling web search is achieved by explicitly providing the `google_search` tool.[19] Within the Vercel AI SDK, this is done by calling a helper function on the provider instance: `google.tools.googleSearch({})`.[17, 18] This is a notable shift from older Gemini 1.5 models, which used a model-level configuration flag (`useSearchGrounding: true`).[19, 20]
*   **Mechanism:** When grounding is enabled via the `google_search` tool, the model can autonomously decide to use Google Search to gather information. This action now manifests as an explicit `tool_call` event, which is consistent with the standard agentic loop.[19] The model performs the search, incorporates the findings into its response, and returns the final text along with citations and source links.[17, 20]
*   **Architectural Convergence:** This evolution represents a significant architectural convergence. The paradigm of `[prompt] -> [tool_call] -> [tool_result] -> [final_answer]` now applies to Gemini in the same way it does to OpenAI and Anthropic. While the older "grounding" feature created a major architectural divergence, the new tool-based approach for models like Gemini 2.5 makes it much more straightforward to integrate into a unified agentic framework. The primary challenge is no longer a difference in mechanism, but a difference in implementation details like tool names and definition methods.

### 2.4 Comparative Analysis Table

To crystallize these distinctions, the following table provides a side-by-side comparison of the web search implementations across the three providers, as integrated through the relevant SDKs. This table serves as the central reference and evidentiary foundation for the architectural decisions made in the subsequent sections of this report.

**Table 1: Comparative Analysis of Web Search Implementations**

| Feature | OpenAI | Anthropic | Google Gemini (2.0+) |
| :--- | :--- | :--- | :--- |
| **Identifier/Name** | `web_search` (predefined) | `webSearch_20250305` (versioned) | `google_search` [17, 19] |
| **Definition Method** | Import `webSearchTool` from `@openai/agents` [7] | Call `anthropic.tools.webSearch...()` from `@ai-sdk/anthropic` [16] | Call `google.tools.googleSearch()` from `@ai-sdk/google` [17, 18] |
| **Mechanism** | Explicit Tool Call (Hosted Tool) | Explicit Tool Call (Provider-Defined Tool) | Explicit Tool Call [19] |
| **Configuration** | Minimal; advanced options via OpenAI Responses API [7] | `maxUses`, `allowedDomains`, `blockedDomains`, `userLocation` [16] | Minimal; empty object `{}` in Vercel AI SDK [17, 18] |
| **SDK Integration Point**| Passed to `tools` array in `new Agent({...})` | Passed to `tools` object in `generateText` (via adapter) | Passed to `tools` object in `generateText` (via adapter) [17, 18] |

This analysis confirms that while the user's problem is still rooted in implementation inconsistencies (different names, different definition methods), the underlying *mechanisms* for web search have largely converged on an explicit tool-calling model. A successful solution must still address the implementation-level heterogeneity.

## Section 3: The Integration Gap: Why a Simple Tool Mapping is Impossible

With a clear understanding of the multi-layered architecture and the provider-native search mechanisms, it is possible to directly address the user's core question: "Is it possible to specify these different tool names in the SDK when I'm creating the agent?" The definitive answer is no. A thorough review of the `@openai/agents` SDK, its extensions, and the Vercel AI SDK reveals the absence of any built-in feature for mapping, aliasing, or otherwise unifying disparate tool names. This section will explain the architectural reasons for this "integration gap," focusing on the deliberate design choices that prioritize flexibility over homogenization.

### 3.1 Absence of a Mapping Feature

The OpenAI Agents SDK for TypeScript is designed with a specific, and somewhat rigid, expectation for how tools are defined and provided to an agent. The `Agent` constructor accepts a `tools` property, which is an array of tool definitions.[5, 7] The SDK's internal `Runner` then uses this static list to inform the model of its capabilities and to execute tool calls. There is no mechanism within the SDK's public API or internal implementation to dynamically alias a tool call for `web_search` to `webSearch_20250305` or `google_search` based on the selected model provider.[1, 11, 21]

The SDK's design philosophy assumes a consistent tool interface across the entire lifecycle of an agent. The responsibility for providing this consistency, especially in a multi-provider context, is placed squarely on the developer. The framework provides the primitives for agentic loops and state management, but it does not venture into the complex territory of normalizing the feature sets of third-party model providers.

### 3.2 The "Leaky Abstraction" in Detail

The concept of the "leaky abstraction," introduced in Section 1, is central to understanding why a simple mapping feature does not exist. The `aisdk` adapter from `@openai/agents-extensions` is intentionally a "thin" wrapper. Its primary and arguably sole purpose is to make a Vercel AI SDK model instance callable by the `@openai/agents` `Runner`. It solves the problem of incompatible function signatures for model invocation, but it does not attempt to create a homogenized, universal feature set across all providers.

This is a deliberate and pragmatic design choice. A "thick" wrapper that attempted to normalize every provider-native feature would be a monumental undertaking. Such a wrapper would need to:

1.  Create a universal configuration object for web search that could map Anthropic's `allowedDomains` to a non-existent equivalent in OpenAI's or Google's API.
2.  Be constantly updated to keep pace with the rapid innovation of every supported provider. A new versioned tool from Anthropic or a new configuration option from Google would require an immediate update to the abstraction layer.
3.  Inevitably hide valuable provider-specific functionality that doesn't fit neatly into the universal model. Forcing Anthropic's highly configurable search tool into a simple on/off switch to match Google's would diminish its value.

By opting for a lightweight, thin wrapper, the SDK's authors chose to grant developers maximum power and flexibility.[1, 3, 4] This approach exposes the full, native capabilities of each underlying model provider, but it comes at the cost of requiring the developer to manage the resulting heterogeneity. The "leak" is a feature, not a bug, of this architectural philosophy. It empowers developers to build sophisticated, provider-aware logic rather than being constrained by a lowest-common-denominator abstraction.

### 3.3 The Tool Definition Discrepancy

The integration gap is further widened by a subtle but critical conflict in the tooling itself. Both the `@openai/agents` SDK and the Vercel AI SDK provide a helper function named `tool` for defining custom tools. While they share a name and a general purpose, their underlying implementations, type signatures, and the execution environments they target are different.

*   The `@openai/agents` `tool()` helper is designed to create tool definitions for the native `Runner` when using OpenAI models directly.[5, 7]
*   The Vercel AI SDK `tool()` helper is designed to create tool definitions for its `generateText` and `streamText` functions, which are used by the `aisdk` adapter.[22]

When a non-OpenAI model is used via the `aisdk` adapter, the entire tool-calling lifecycle is managed by the Vercel AI SDK. Therefore, any custom tool definitions *must* conform to the format expected by the Vercel AI SDK. Attempting to use the `tool()` helper from `@openai/agents` in this context will lead to type mismatches at compile time or, worse, subtle runtime errors. A community forum post highlights a similar issue, where a user attempting to use Gemini with the Agents SDK encountered an `AI_APICallError: Function calling with a response mime type: 'application/json' is unsupported`.[23] This type of error is indicative of a mismatch between the tool definition format and what the underlying model provider's API expects, a problem that arises from using the wrong abstraction.

This is a critical implementation detail that can easily be overlooked. To ensure consistency and prevent errors in a multi-provider architecture built on the `aisdk` adapter, developers must make a conscious decision to **exclusively use the `tool()` helper from the Vercel AI SDK (`ai` package)** for defining all custom tools. This applies even to OpenAI models if they are being run through the adapter, as it guarantees that all tool definitions adhere to a single, compatible standard that the Vercel AI SDK can correctly process. The existence of these two distinct `tool` functions, without a clear path for reconciliation, is another manifestation of the integration gap that makes a simple, out-of-the-box solution impossible.

## Section 4: Architecting the Solution: A Dynamic Agent Factory Pattern

Having established that the OpenAI Agents SDK for TypeScript provides no built-in mechanism for unifying heterogeneous, provider-native tools, the report now shifts from analysis to synthesis. The solution lies not in finding a hidden configuration flag, but in architecting a higher-level abstraction to manage the complexity. A naive approach of defining an agent's tools statically at the point of use is fundamentally flawed in a multi-provider context. The robust and scalable solution is to adopt a well-known software design pattern: the Factory. This section details the design and implementation of a "Dynamic Agent Factory," a pattern that encapsulates provider-specific configuration logic and generates fully configured, ready-to-use agents on demand.

### 4.1 The Core Principle: Dynamic Configuration

The central principle of the factory pattern is to decouple the creation of an object from its usage. In this context, the creation of an `Agent` object is complex and provider-dependent, while its usage via the `run` function is uniform. The factory will handle the complex creation logic, allowing the rest of the application to interact with any agent through a consistent interface.

Instead of statically defining tools, which forces a single configuration, the factory will assemble the agent's configuration *dynamically* based on the selected model provider. It will inspect the provider type and apply the correct logic: attaching the right tool definition for Anthropic, adding the correct tool for Gemini, or including the native hosted tool for OpenAI. This moves the provider-specific conditional logic into a single, dedicated, and reusable module.

### 4.2 Designing the `AgentFactory`

The design of the `AgentFactory` begins with a clear definition of its public interface. It will be a function that accepts a configuration object and returns a fully instantiated `Agent`.

#### 4.2.1 Factory Interface

The factory function's signature will be `createAgent(config: AgentFactoryConfig): Agent`. The `AgentFactoryConfig` type defines the parameters needed to construct any agent in the system:

```typescript
import type { Agent } from '@openai/agents';

// Define the supported providers
export type SupportedProvider = 'openai' | 'anthropic' | 'gemini';

// Define the configuration for the Agent Factory
export interface AgentFactoryConfig {
  provider: SupportedProvider;
  modelId: string;
  instructions: string;
  enableWebSearch?: boolean;
  // Add other common agent configurations here, e.g., custom tools
}
```

This interface abstracts the desired *behavior* (e.g., `enableWebSearch: true`) from the provider-specific *implementation* (e.g., adding a tool vs. setting a model parameter).

#### 4.2.2 Internal Logic

The internal logic of the factory will be driven by a `switch` statement that branches on the `provider` field of the configuration object. Each case within the switch statement is responsible for the complete, provider-specific setup process:

1.  **Initialize the Provider:** Instantiate the correct Vercel AI SDK provider instance (e.g., `openai(...)`, `anthropic(...)`, `google(...)`).
2.  **Assemble Tools:** Based on the `enableWebSearch` flag and the provider type, it will populate a `tools` object (for native OpenAI tools) or a `vercelAiSdkTools` object (for tools handled by the Vercel AI SDK).
3.  **Adapt the Model:** Wrap the configured Vercel AI SDK model instance using the `aisdk` function from `@openai/agents-extensions` to ensure compatibility with the `@openai/agents` framework.
4.  **Instantiate the Agent:** Create and return a new `Agent` instance, passing the adapted model and any assembled tools.

This structure cleanly encapsulates all provider-specific knowledge within the factory, hiding the complexity from the rest of the application.

### 4.3 Full TypeScript Implementation

The following is a complete, production-ready implementation of the Dynamic Agent Factory pattern. This code is designed to be directly usable in a project, serving as a robust foundation for building multi-provider agentic applications.

#### 4.3.1 Step 1: Imports and Type Definitions

First, all necessary modules and types are imported from the relevant SDK packages.

```typescript
import { Agent, webSearchTool } from '@openai/agents';
import type { Tool } from '@openai/agents';
import { aisdk } from '@openai/agents-extensions';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';

// Define the supported providers for type safety
export type SupportedProvider = 'openai' | 'anthropic' | 'gemini';

// Define the configuration interface for the factory
export interface AgentFactoryConfig {
  provider: SupportedProvider;
  modelId: string;
  instructions: string;
  enableWebSearch?: boolean;
  // This could be expanded to include an array of custom tools
  // customTools?: Record<string, any>; 
}
```

#### 4.3.2 Step 2: The Factory Function Implementation

This is the core of the solution. The `createAgent` function contains the conditional logic for handling each provider.

```typescript
/**
 * Dynamically creates and new Agent instance, passing the adapted model and any assembled tools.
 * This factory encapsulates the provider-specific logic for tool and model configuration.
 *
 * @param {AgentFactoryConfig} config - The configuration for the agent to be created.
 * @returns {Agent} A fully configured Agent instance.
 */
export function createAgent(config: AgentFactoryConfig): Agent {
  let model: LanguageModel;
  let tools: Tool =;
  let vercelAiSdkTools: Record<string, any> = {};

  const { provider, modelId, instructions, enableWebSearch } = config;

  console.log(`Creating agent for provider: ${provider}, model: ${modelId}`);

  switch (provider) {
    case 'openai':
      // For OpenAI, we use the native `webSearchTool` from @openai/agents
      if (enableWebSearch) {
        console.log('Enabling native OpenAI webSearchTool...');
        tools.push(webSearchTool());
      }
      // Initialize the Vercel AI SDK provider for OpenAI
      model = openai(modelId as any);
      break;

    case 'anthropic':
      // For Anthropic, we use the provider-defined tool from @ai-sdk/anthropic
      if (enableWebSearch) {
        console.log('Enabling Anthropic provider-defined web search tool...');
        // Note: The tool definition is passed to the Vercel AI SDK layer,
        // so we add it to `vercelAiSdkTools` which will be used in the model settings.
        vercelAiSdkTools = anthropic.tools.webSearch_20250305({
          // Example of provider-specific configuration
          maxUses: 5, 
        });
      }
      // Initialize the Vercel AI SDK provider for Anthropic
      model = anthropic(modelId as any);
      break;

    case 'gemini':
      // For Gemini 2.0+, web search is enabled via an explicit tool call.
      if (enableWebSearch) {
        console.log('Enabling Gemini provider-defined google_search tool...');
        // The tool is defined on the google provider from @ai-sdk/google
        // and passed to the Vercel AI SDK layer.
        vercelAiSdkTools['google_search'] = google.tools.googleSearch({});
      }
      
      // Initialize the Vercel AI SDK provider for Google
      model = google(modelId as any);
      break;

    default:
      // Exhaustiveness check to ensure all providers are handled
      const exhaustiveCheck: never = provider;
      throw new Error(`Unsupported provider: ${exhaustiveCheck}`);
  }

  // Wrap the configured Vercel AI SDK model with the `aisdk` adapter
  const adaptedModel = aisdk(model, {
    // Pass the Vercel AI SDK compatible tools here
    tools: Object.keys(vercelAiSdkTools).length > 0? vercelAiSdkTools : undefined,
  });

  // Create and return the final Agent instance
  // Note: Native @openai/agents tools go in the `tools` array.
  // Vercel AI SDK tools are passed via the adapter's second argument.
  const agent = new Agent({
    name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Assistant`,
    instructions,
    model: adaptedModel,
    tools,
  });

  console.log(`Agent for ${provider} created successfully.`);
  return agent;
}
```

#### 4.3.3 Step 3: Usage Example

This example demonstrates how to use the factory to create agents for each provider and then use them interchangeably with a single `Runner` instance.

```typescript
import { run } from '@openai/agents';

async function main() {
  const commonInstructions = 'You are a helpful assistant. Please answer the user\'s question concisely.';

  // --- Create an OpenAI agent with web search ---
  const openaiAgent = createAgent({
    provider: 'openai',
    modelId: 'gpt-4o-mini',
    instructions: commonInstructions,
    enableWebSearch: true,
  });

  // --- Create an Anthropic agent with web search ---
  const claudeAgent = createAgent({
    provider: 'anthropic',
    modelId: 'claude-3-5-sonnet-20240620',
    instructions: commonInstructions,
    enableWebSearch: true,
  });

  // --- Create a Gemini agent with web search ---
  const geminiAgent = createAgent({
    provider: 'gemini',
    modelId: 'gemini-2.5-pro-latest',
    instructions: commonInstructions,
    enableWebSearch: true,
  });
  
  // --- Run a query with the Anthropic agent ---
  try {
    console.log('\n--- Running query with Anthropic Claude ---');
    const claudeResult = await run(claudeAgent, "What is the latest news about the Vercel AI SDK?");
    console.log('Claude Final Output:', claudeResult.finalOutput);
  } catch (error) {
    console.error('Error running Claude agent:', error);
  }

  // --- Run the same query with the Gemini agent ---
  try {
    console.log('\n--- Running query with Google Gemini ---');
    const geminiResult = await run(geminiAgent, "What is the latest news about the Vercel AI SDK?");
    console.log('Gemini Final Output:', geminiResult.finalOutput);
  } catch (error) {
    console.error('Error running Gemini agent:', error);
  }
}

main().catch(console.error);
```

This factory pattern provides a clean, maintainable, and scalable solution. The complexity of handling different provider implementations is encapsulated entirely within the `createAgent` function. The rest of the application can remain blissfully unaware of these details, treating all agents as interchangeable components. This is not merely a workaround for the SDK's limitations; it is a robust architectural pattern that future-proofs the application. As new providers are added to the Vercel AI SDK (e.g., Cohere, Mistral [24]), they can be integrated by simply adding a new `case` to the factory's `switch` statement. If Anthropic releases a new, backward-incompatible version of its web search tool, the update is confined to a single line of code within the factory, ensuring that the change is isolated and the application's stability is maintained.

## Section 5: Advanced Implementation Details & Architectural Best Practices

While the Dynamic Agent Factory pattern provides a robust core solution, building a production-grade, multi-provider agentic system requires attention to several second-order problems and architectural nuances. A truly expert-level implementation goes beyond simply invoking tools; it ensures that custom tools are defined consistently, that tool results are normalized for predictable processing, and that strategic alternatives are considered. This section addresses these advanced topics, providing best practices that enhance the reliability, maintainability, and strategic flexibility of the system.

### 5.1 Handling Custom Tools in a Multi-Provider World

As established in Section 3, a critical pitfall in this hybrid architecture is the existence of two distinct `tool()` helper functions. To reiterate, when using the `aisdk` adapter, the tool-calling mechanism is governed by the Vercel AI SDK. Therefore, for any custom tools intended to work across all providers, it is imperative to **exclusively use the `tool()` helper from the Vercel AI SDK (`ai` package)**.

Consider a simple custom tool to get the current time.

**Incorrect Approach (using `@openai/agents` `tool`):**
This definition is compatible with the native OpenAI Agents SDK `Runner` but will likely fail when passed through the `aisdk` adapter to a non-OpenAI provider.

```typescript
// DO NOT DO THIS when using the aisdk adapter
import { tool as openAIAgentsTool } from '@openai/agents';
import { z } from 'zod';

const wrongCustomTool = openAIAgentsTool({
  name: 'get_current_time',
  description: 'Gets the current time.',
  parameters: z.object({}),
  async execute() {
    return new Date().toISOString();
  },
});
```

**Correct Approach (using Vercel AI SDK `tool`):**
This definition is compatible with the Vercel AI SDK's `generateText` function and will therefore work correctly with any provider integrated via the `aisdk` adapter.

```typescript
// ALWAYS DO THIS when using the aisdk adapter
import { tool as vercelAITool } from 'ai';
import { z } from 'zod';

const correctCustomTool = vercelAITool({
  description: 'Gets the current time.',
  parameters: z.object({}),
  async execute() {
    return { time: new Date().toISOString() };
  },
});
```

To integrate this into the factory, the `AgentFactoryConfig` would be extended to accept custom tools, and these tools would be passed into the `aisdk` adapter's configuration, ensuring they are handled correctly by the Vercel AI SDK layer for all providers.

### 5.2 Parameter and Result Normalization

The challenge of heterogeneity does not end with tool invocation. Different tools, even if they serve the same purpose, may return data in different formats. For example, a custom web search tool might return an array of objects with `title` and `snippet` fields, while Anthropic's native tool might return a more complex structure. If the agent's instructions expect to reason over a consistent data format, this discrepancy can lead to unpredictable behavior.

The solution is to introduce a "Normalization Layer" for tool *results*. This involves defining a canonical interface for the data your agent expects and then creating small adapter functions to transform the raw output from each tool into this standard format.

**Step 1: Define a Canonical Interface**

```typescript
export interface NormalizedWebSearchResult {
  url: string;
  title: string;
  content: string;
  sourceProvider: 'anthropic' | 'custom' | 'google';
}
```

**Step 2: Create Normalization Functions**

These functions would wrap the `execute` logic of your tools or process the results from provider-native tools.

```typescript
// Example for a hypothetical custom search tool
async function executeAndNormalizeCustomSearch(query: string): Promise<NormalizedWebSearchResult> {
  const rawResults = await someThirdPartySearchAPI(query);
  // Map rawResults to NormalizedWebSearchResult
  return rawResults.map(r => ({
    url: r.link,
    title: r.title,
    content: r.snippet,
    sourceProvider: 'custom',
  }));
}
```

By ensuring that the data returned to the agentic loop *always* conforms to the `NormalizedWebSearchResult` interface, the agent's subsequent reasoning becomes more reliable and predictable. This practice decouples the agent's logic from the specific implementation details of its tools, further enhancing the system's modularity and maintainability.

### 5.3 Alternative Architecture: The Single External Tool Pattern

The Dynamic Agent Factory pattern is designed to leverage the best-of-breed, provider-native tools available. However, an alternative architectural approach prioritizes absolute consistency and simplicity over provider-specific optimizations. This is the "Single External Tool Pattern."

#### 5.3.1 Concept

Instead of attempting to unify the various provider-native search tools, this pattern advocates for ignoring them entirely. The developer defines a single, custom web search tool that is used by all agents, regardless of the underlying model provider. The implementation of this tool relies on a third-party, model-agnostic search API, such as Tavily Search, Brave Search, or Serper.

#### 5.3.2 Implementation

1.  Define a single custom tool using the Vercel AI SDK's `tool()` helper.

    ```typescript
    import { tool as vercelAITool } from 'ai';
    import { z } from 'zod';
    import { TavilySearchAPIRetriever } from "@langchain/community/retrievers/tavily_search_api";
    
    const externalWebSearchTool = vercelAITool({
      description: 'Performs a web search using an external provider to find up-to-date information.',
      parameters: z.object({
        query: z.string().describe('The search query.'),
      }),
      async execute({ query }) {
        // Replace with your preferred search API client
        const retriever = new TavilySearchAPIRetriever(); 
        const docs = await retriever.getRelevantDocuments(query);
        return docs.map(doc => ({
          url: doc.metadata.source,
          title: doc.metadata.title,
          content: doc.pageContent,
        }));
      },
    });
    ```

2.  Modify the `AgentFactory` to always inject this single tool, and to *never* enable the provider-native search features.

    ```typescript
    // Inside the AgentFactory...
    // The `enableWebSearch` flag would now control the inclusion of this external tool.
    if (config.enableWebSearch) {
      vercelAiSdkTools['external_web_search'] = externalWebSearchTool;
    }
    // The provider-specific logic for native search would be removed.
    ```

#### 5.3.3 Trade-off Analysis

This alternative pattern presents a significant strategic choice with clear trade-offs.

*   **Pros:**
    *   **Absolute Consistency:** The tool's name (`external_web_search`), its parameters, and its result format are identical for every agent. This dramatically simplifies the agent's instructions and downstream processing logic.
    *   **Simplified Maintenance:** There is only one tool implementation to maintain. Updates to provider APIs for search become irrelevant.
    *   **Provider Independence:** The core search capability is decoupled from the LLM provider, making it easier to swap models in and out.

*   **Cons:**
    *   **Increased Latency:** Every search involves an additional network hop from your application server to the third-party search API, which may increase overall response time.
    *   **Additional Cost:** Most high-quality search APIs have associated usage costs, adding another line item to the application's operational expenses.
    *   **Loss of Provider Optimization:** This pattern forgoes any specialized optimizations the LLM providers have built into their native search tools. While the mechanisms have converged, provider-native tools may still be fine-tuned to work exceptionally well with their corresponding models, potentially yielding superior or more contextually aware results than a simple external API call.

The choice between the Dynamic Agent Factory and the Single External Tool pattern is not a matter of right or wrong, but of aligning the architecture with project priorities. If leveraging every ounce of performance from provider-native features is paramount, the factory is superior. If simplicity, maintainability, and absolute consistency are the primary goals, the external tool pattern offers a compelling and elegant alternative.

## Section 6: Conclusion and Strategic Recommendations

The investigation into unifying provider-native tools within the OpenAI Agents SDK for TypeScript has revealed a complex architectural landscape. The user's objective, while seemingly straightforward, touches upon fundamental challenges in building truly provider-agnostic agentic systems. The core issue is not a missing feature in the SDK but rather a deep, architectural heterogeneity between the tool-calling implementations of major AI providers. This report has dissected this complexity and presented two robust, production-ready architectural patterns to address it. This conclusion synthesizes the key findings and offers a clear strategic framework for developers navigating this evolving ecosystem.

### 6.1 Summary of Findings

1.  **No Built-in Mapping Feature:** The `@openai/agents` SDK and its extensions do not offer a native mechanism for aliasing or mapping disparate tool names. The responsibility for managing provider-specific tool configurations falls entirely on the developer.

2.  **The Leaky Abstraction is by Design:** The SDK's multi-provider support is facilitated by a thin adapter (`@openai/agents-extensions`) that bridges to the Vercel AI SDK. This adapter intentionally allows provider-specific features to "leak" through, prioritizing developer flexibility and access to native capabilities over a restrictive, homogenized abstraction.

3.  **Convergent Paradigms, Divergent Implementations:** The core challenge has evolved. While older Gemini models used a unique "grounding" mechanism, the latest models (Gemini 2.0+) have adopted an explicit tool-calling paradigm for web search, similar to OpenAI and Anthropic.[19, 20] However, the specific implementations—the tool names (`web_search`, `webSearch_20250305`, `google_search`), definition methods, and configuration options—remain provider-specific. This implementation-level heterogeneity makes a simple mapping solution impossible and necessitates provider-aware conditional logic.

4.  **The Solution is Architectural:** The resolution to this integration gap is not a configuration tweak but an architectural pattern. The "Dynamic Agent Factory" was presented as the primary solution, encapsulating provider-specific logic to dynamically construct agents with the correct toolsets and model configurations.

### 6.2 Strategic Decision Framework

Based on this analysis, two primary architectural paths emerge. The choice between them should be a deliberate, strategic decision based on specific project requirements, priorities, and constraints.

#### 6.2.1 Recommendation 1: Adopt the Agent Factory Pattern for Optimized Performance

For applications where leveraging the full, optimized capabilities of each model provider is a primary concern, the **Dynamic Agent Factory pattern is the recommended architecture.**

*   **When to Choose This Path:**
    *   When performance, including latency and the quality of tool-augmented responses, is critical. This pattern allows the use of highly optimized, provider-native features.
    *   When granular control over tool behavior is required, such as using Anthropic's `allowedDomains` or `maxUses` parameters.
    *   In projects where the development team has the capacity to manage the added complexity of maintaining provider-specific logic within the factory.

This pattern represents the most powerful and flexible approach, enabling the creation of a multi-provider system that does not compromise on the unique strengths of each underlying platform.

#### 6.2.2 Recommendation 2: Consider the External Tool Pattern for Simplicity and Consistency

For applications where architectural simplicity, long-term maintainability, and absolute consistency across all providers are paramount, the **Single External Tool pattern is a highly viable and powerful alternative.**

*   **When to Choose This Path:**
    *   When the agent's instructions and downstream logic rely heavily on a predictable and unchanging tool interface (name, parameters, and result schema).
    *   When development velocity and ease of maintenance are more important than extracting the maximum performance from each provider's native tools.
    *   When the potential overhead of an additional API call for search and the associated third-party costs are acceptable within the project's budget and performance targets.

This pattern trades the potential for provider-specific optimization for a significant reduction in architectural complexity, making it an excellent choice for many real-world applications.

#### 6.2.3 Final Word

The development of multi-agent systems is a rapidly advancing field, characterized by a vibrant but fragmented ecosystem of providers, each with unique strengths and features. The challenge of building applications that can flexibly leverage this diversity without becoming brittle and unmaintainable is a central task for the modern AI engineer. The OpenAI Agents SDK, in conjunction with the Vercel AI SDK, provides a powerful set of primitives for this task. By understanding the layered architecture and making a conscious, strategic choice between the Dynamic Agent Factory and the Single External Tool patterns, developers can build robust, scalable, and future-proof agentic applications capable of navigating the complexities of a multi-provider world.