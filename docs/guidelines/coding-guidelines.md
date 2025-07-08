# Coding Guidelines

## Overview

This document outlines the coding standards, conventions, and best practices for the Business Idea Generator POC. These guidelines are based on the technology stack defined in [`docs/guidelines/architecture.md`](docs/guidelines/architecture.md) and leverage modern industry standards for TypeScript, Node.js, and the OpenAI Agents SDK.


## Code Quality

We will rely on ESLint for static code analysis and maintaining code quality. Configuration details are managed in [`eslint.config.js`](eslint.config.js).


## OpenAI Agents SDK Patterns

### Basic Agent Creation

This example shows the simplest way to create and run an agent.

```javascript
import { Agent, run } from '@openai/agents';

const agent = new Agent({
  name: 'Assistant',
  instructions: 'You are a helpful assistant',
});

const result = await run(
  agent,
  'Write a haiku about recursion in programming.',
);
console.log(result.finalOutput);
// Code within the code,
// Functions calling themselves,
// Infinite loop's dance.
```

### Agent with Tools

This example demonstrates how to define a custom tool and attach it to an agent.

```javascript
import { z } from 'zod';
import { Agent, run, tool } from '@openai/agents';

const getWeatherTool = tool({
  name: 'get_weather',
  description: 'Get the weather for a given city',
  parameters: z.object({ city: z.string() }),
  execute: async (input) => {
    return `The weather in ${input.city} is sunny`;
  },
});

const agent = new Agent({
  name: 'Data agent',
  instructions: 'You are a data agent',
  tools: [getWeatherTool],
});

async function main() {
  const result = await run(agent, 'What is the weather in Tokyo?');
  console.log(result.finalOutput);
}

main().catch(console.error);
```

---


---

## Documentation Standards

### JSDoc Comments

```typescript
/**
 * Creates a new agent with the specified configuration.
 * 
 * @param config - The agent configuration object
 * @returns A promise that resolves to the created agent
 * @throws {AgentError} When agent creation fails
 * 
 * @example
 * ```typescript
 * const agent = await createAgent({
 *   name: 'Ideation Agent',
 *   model: 'o3',
 *   instructions: 'Generate creative business ideas',
 *   tools: []
 * });
 * ```
 */
async function createAgent(config: AgentConfig): Promise<Agent> {
  // Implementation
}

/**
 * Represents the configuration for an AI agent.
 */
interface AgentConfig {
  /** The display name of the agent */
  readonly name: string;
  /** The OpenAI model to use (e.g., 'o3') */
  readonly model: string;
  /** Instructions that define the agent's behavior */
  readonly instructions: string;
  /** List of tools available to the agent */
  readonly tools: readonly string[];
}
```

### README Documentation

Each module should include a README.md with:
- Purpose and overview
- Installation instructions
- Usage examples
- API documentation
- Contributing guidelines

---

## Version Control Guidelines

### Commit Messages

Use conventional commits format:

```
feat: add agent handoff functionality
fix: resolve thread creation timeout issue
docs: update API documentation
chore: upgrade TypeScript to 5.3
test: add unit tests for agent factory
```