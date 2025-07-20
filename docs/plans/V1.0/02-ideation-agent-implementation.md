# Detailed Plan: Ideation Agent Implementation

This document provides the detailed implementation plan for the second increment: developing the Ideation Agent.

## 1. Detailed Scope

### Agent Logic & Prompting
- **Full Implementation**: Replace the placeholder `ideation-agent.ts` with the full agent logic.
- **Detailed Prompting**: Develop a detailed, multi-step prompt for the agent. The prompt must instruct the agent to generate exactly 10 business ideas based on the `BusinessPreferences` (vertical, sub-vertical, business model) passed by the orchestrator.
- **Scoring and Reasoning**: The prompt must explicitly instruct the agent to provide a score (from 0 to 10) and detailed reasoning for each of the four initial dimensions: `disruptionPotential`, `marketPotential`, `technicalComplexity`, and `capitalIntensity`.

### Data Structures & Integration
- **Strict Conformance**: Ensure the agent's output strictly conforms to the `IdeationAgentOutput[]` type defined in `agent-types.ts`. This is critical for the type-safe data flow managed by the orchestrator.
- **Orchestrator Integration**: Update the `AgentOrchestrator` to correctly pass the hardcoded `BusinessPreferences` to the Ideation Agent and to receive and handle the structured `IdeationAgentOutput[]` array that the agent returns.

### Out of Scope for this Increment
- The Ideation Agent will not use any external tools (i.e., no `web_search`).
- The other agents in the chain (Competitor, Critic, Documentation) will remain as simple placeholders from the previous increment. Their full implementation is not part of this scope.

## 2. Detailed Acceptance Criteria

### Functional Correctness
- **Agent Invocation**: When the application is executed, the `AgentOrchestrator` correctly calls the Ideation Agent with the hardcoded `BusinessPreferences`.
- **API Interaction**: The agent successfully establishes a connection and makes a call to the OpenAI API, receiving a valid (non-error) response.
- **Output Quantity**: The agent's final output is an array containing exactly 10 distinct business idea objects.

### Data Validation
- **Type Conformance**: Every object in the output array strictly validates against the `IdeationAgentOutput` TypeScript type without any compilation or runtime errors.
- **Content Integrity**:
    - Each business idea object includes a non-empty `title` and `description`.
    - All four scoring dimensions (`disruptionPotential`, `marketPotential`, `technicalComplexity`, `capitalIntensity`) are present for each of the 10 ideas and have a numeric value between 0 and 10 (inclusive).
    - The `reasoning` field associated with each of the four scores contains a non-empty, descriptive string.

### Integration
- **Data Handoff**: The `AgentOrchestrator` successfully receives the array of 10 business ideas from the Ideation Agent. To verify, the orchestrator will log the title of the first business idea to the console, proving a successful data handoff.

## 3. Detailed Documentation Tasks

- **JSDoc Comments**: Add comprehensive JSDoc comments to the new `ideation-agent.ts` file. This should clearly explain the purpose of the agent, its parameters (the `BusinessPreferences`), and its return value (the `IdeationAgentOutput[]` array), following the conventions in `coding-guidelines.md`.
- **README.md Update**: Add a section to the main project `README.md` that provides a high-level description of the Ideation Agent's role and its responsibilities within the multi-agent system.