# Business Critic Agent Implementation - Task Plan

## Overview
This task plan details the implementation of the Business Critic Agent, which performs critical evaluation and risk assessment of business ideas using web search capabilities and calculates the final Overall Score based on ADR-005.

## Sub-Tasks

### 1. Create Schema Files for Business Critic Agent
**File**: `src/schemas/critic-agent-schemas.ts`
- Create `CriticAgentInputSchema` using zod to validate input (array of business ideas from competitor agent)
- Create `CriticAgentOutputSchema` to validate the final output with populated `criticalAnalysis` and `overallScore` fields
- Define TypeScript types: `CriticAgentInput` and `CriticAgentOutput`
- Define `CriticStreamEvent` type for streaming support (chunk, status, critical-analysis, complete)
- Follow the same pattern as `competitor-agent-schemas.ts`

### 2. Implement Business Critic Agent Core Logic
**File**: `src/agents/critic-agent.ts`
- Import required dependencies: `Agent`, `run`, `webSearchTool` from `@openai/agents`
- Import `BusinessIdea` type and schema types
- Create detailed system prompt that instructs the agent to:
  - Perform critical evaluation of each business idea
  - Use web search to research potential risks, challenges, and weaknesses
  - Provide balanced and realistic critical analysis
  - Calculate Overall Score using ADR-005 methodology
  - Return JSON in the required format
- Include the Overall Score calculation formula in the prompt:
  ```
  baseScore = (0.20 × disruptionPotential) + 
              (0.25 × marketPotential) + 
              (0.15 × (10 - technicalComplexity)) + 
              (0.15 × (10 - capitalIntensity)) + 
              (0.25 × blueOceanScore)
  
  overallScore = clamp(baseScore + riskAdjustment, 0, 10)
  ```
- Create `createCriticAgent()` function that returns new Agent with:
  - Name: 'Business Critic Agent'
  - Model: 'o3' (matching other agents)
  - Tools: [webSearchTool()]
  - Instructions: The detailed prompt

### 3. Implement Single-Idea Processing Function
**File**: `src/agents/critic-agent.ts`
- Create `analyzeSingleIdea(idea: BusinessIdea): Promise<BusinessIdea>` function
- Pattern similar to competitor agent:
  - Create agent instance
  - Format prompt with the business idea data
  - Call agent with `run()` (non-streaming)
  - Parse JSON response
  - Populate `criticalAnalysis` and `overallScore` fields
  - Update `reasoning.overall` field
  - Handle errors gracefully with default values

### 4. Implement Streaming Support Function
**File**: `src/agents/critic-agent.ts`
- Create `runCriticAgent(input: CriticAgentInput): AsyncGenerator<CriticStreamEvent>` function
- Implement sequential processing of ideas:
  - Yield status updates for progress tracking
  - Process each idea individually using `analyzeSingleIdea()`
  - Yield chunk events with progress information
  - Yield critical-analysis events with results
  - Validate final output with `CriticAgentOutputSchema`
  - Handle errors and continue processing

### 5. Integration with Test Cache Service
**File**: `src/agents/critic-agent.ts`
- Import `testCacheService` from '../services/test-cache-service.js'
- In `runCriticAgent()`, before processing:
  - Check if cache is enabled
  - Try to load cached data with key 'critic-ideas'
  - If cached data exists, yield appropriate status and return cached results
- After successful processing:
  - Save results to cache with key 'critic-ideas'

### 6. Update Agent Orchestrator Integration
**File**: `src/orchestrator/agent-orchestrator.ts`
- Import `runCriticAgent` and related types
- In the `run()` method:
  - After competitor agent completes, pass enriched ideas to critic agent
  - Handle streaming events from critic agent
  - Update progress tracking
  - Capture the final fully-analyzed business ideas
- Update the final verification to log the `overallScore` of the first idea (acceptance criteria)

### 7. Add JSDoc Documentation
**File**: `src/agents/critic-agent.ts`
- Add comprehensive JSDoc comments:
  - File-level comment explaining the agent's purpose
  - Document the system prompt constant
  - Document `createCriticAgent()` function
  - Document `analyzeSingleIdea()` with parameters and return type
  - Document `runCriticAgent()` with usage example
  - Explain web search tool usage for risk assessment

### 8. Update Project Documentation
**File**: `README.md`
- Add a new section for the Business Critic Agent:
  - Describe its role in performing final evaluation
  - Explain risk assessment methodology
  - Mention Overall Score calculation (reference ADR-005)
  - Note the use of web search for research

### 9. Manual Testing Checklist
**Note**: Per architecture guidelines, no automated tests are required for POC
- Test full agent chain execution
- Verify all 10 ideas have populated `criticalAnalysis` fields
- Verify all 10 ideas have `overallScore` between 0-10
- Verify Overall Score calculation follows ADR-005 formula
- Test error handling with network issues
- Test cache functionality with `--test-cache` flag
- Verify orchestrator logs first idea's `overallScore`

## Verification Points
- All code follows TypeScript strict mode requirements
- Zod schemas provide runtime validation (ADR-001)
- Single-idea processing pattern matches competitor agent
- Overall Score calculation implements ADR-005
- Test cache integration follows ADR-004
- JSDoc comments follow coding guidelines
- Agent uses 'o3' model as specified in architecture

## Dependencies
- OpenAI Agents SDK patterns from coding guidelines
- BusinessIdea type structure
- Test Cache Service (ADR-004)
- Overall Score Calculation (ADR-005)
- Structured Output Validation (ADR-001)