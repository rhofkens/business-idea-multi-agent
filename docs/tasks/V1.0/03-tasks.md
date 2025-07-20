# Step 3: Competitor Analysis Agent - Task Breakdown

## Overview
This document provides a detailed, ordered list of sub-tasks for implementing the Competitor Analysis Agent. The implementation must follow all architectural guidelines, coding standards, and ADRs, including the newly created ADR 003 for Blue Ocean scoring methodology.

## Sub-Tasks

### 1. Setup and Configuration

#### 1.1 Create Zod Schema for Competitor Agent Output
- Create `src/schemas/competitor-agent-schemas.ts`
- Define `CompetitorAgentInputSchema` that validates the incoming array of `IdeationAgentOutput`
- Define `CompetitorAgentOutputSchema` that validates the enriched business ideas with:
  - All original fields from `IdeationAgentOutput`
  - `competitorAnalysis: z.string().min(1)` (non-empty string)
  - `blueOceanScore: z.number().min(0).max(10)` (number between 0-10)
- Export schemas for use in the agent implementation

#### 1.2 Create Agent Configuration
- Define agent configuration object with:
  - Model: `o3` (as per architecture guidelines)
  - Name: "Competitor Analysis Agent"
  - Description: Clear description of agent's purpose
  - Tools: Include `webSearchTool` from '@openai/agents'
  - Structured output schema reference

### 2. Core Agent Implementation

#### 2.1 Replace Placeholder Implementation
- Remove the entire placeholder code from `src/agents/competitor-agent.ts`
- Import required dependencies:
  - `Agent` from '@openai/agents'
  - `webSearchTool` from '@openai/agents'
  - Zod schemas from step 1.1
  - Types from `src/types/business-idea.ts`
  - Streaming utilities

#### 2.2 Implement Streaming Architecture
- Follow the pattern from `ideation-agent.ts` for streaming
- Import and use `TypedEventEmitter` for event-based streaming
- Define event types: 'chunk', 'status', 'competitor-analysis', 'complete'
- Implement proper event emission throughout the agent lifecycle

#### 2.3 Create Main Agent Function
- Create `runCompetitorAgent` function that:
  - Accepts `ideas: IdeationAgentOutput[]` parameter
  - Validates input using `CompetitorAgentInputSchema`
  - Returns a stream that emits events and final enriched array

#### 2.4 Implement Web Search Strategy
- For each business idea, perform at least 5 web searches:
  1. Search for direct competitors using the business title/description
  2. Search for market analysis in the idea's industry
  3. Search for existing solutions addressing similar problems
  4. Search for industry trends and growth projections
  5. Search for market size and opportunity data
- Handle search failures gracefully with retry logic
- Aggregate search results for analysis

#### 2.5 Implement Blue Ocean Score Calculation
- Follow ADR 003 methodology:
  - Count direct competitors (40% weight)
  - Assess market saturation (30% weight)
  - Evaluate innovation uniqueness (30% weight)
- Calculate weighted average score
- Round to one decimal place
- Include detailed reasoning in `competitorAnalysis` field

#### 2.6 Implement Two-Pass Generation Pattern
- Follow ADR 002 pattern (similar to ideation agent):
  - First pass: Initial competitive analysis and scoring
  - Second pass: Refinement and validation of scores
- Stream intermediate results between passes
- Ensure final output quality and consistency

### 3. Error Handling and Validation

#### 3.1 Implement Comprehensive Error Handling
- Handle web search API failures with fallback behavior
- Implement retry logic for transient failures (max 3 retries)
- Default to neutral score (5.0) with explanation for persistent failures
- Log all errors to CSV format as per architecture guidelines

#### 3.2 Output Validation
- Validate all output against `CompetitorAgentOutputSchema`
- Ensure all required fields are populated
- Verify Blue Ocean scores are within 0-10 range
- Confirm `competitorAnalysis` contains meaningful content

### 4. Orchestrator Integration

#### 4.1 Update Agent Orchestrator
- Uncomment the competitor agent import in `src/orchestrator/agent-orchestrator.ts`
- Add competitor agent to the execution chain after ideation agent
- Implement proper data handoff:
  - Pass the 10 business ideas from ideation agent
  - Receive enriched ideas with competitor analysis
  - Forward to next agent in chain

#### 5.2 Update Streaming Integration
- Ensure competitor agent events are properly forwarded
- Add specific handling for 'competitor-analysis' events
- Update status messages for user feedback

#### 5.3 Verify Data Flow
- Add logging to verify successful data handoff
- Log the `blueOceanScore` of the first business idea (as per acceptance criteria)
- Ensure all original data is preserved through the enrichment process

### 6. Documentation and Compliance

#### 6.1 Add Inline Documentation
- Document all functions with JSDoc comments
- Include parameter descriptions and return types
- Add examples for complex logic sections

#### 6.2 Update Type Definitions
- Ensure `BusinessIdea` interface properly includes:
  - `competitorAnalysis?: string`
  - `blueOceanScore?: number`
- Verify type consistency across the codebase

#### 6.3 Final Compliance Check
- Verify implementation follows all guidelines in `architecture.md`
- Ensure compliance with `coding-guidelines.md`
- Confirm adherence to all ADRs (001, 0001, 002, 003)
- Check that all acceptance criteria from step plan are met

## Implementation Order
1. Complete Setup and Configuration (1.1-1.2)
2. Implement Core Agent (2.1-2.6)
3. Add Error Handling (3.1-3.2)
4. Integrate with Orchestrator (4.1-4.3)
5. Finalize Documentation (5.1-5.3)

## Success Criteria
- The system runs error-free
- Competitor Analysis Agent enriches all 10 business ideas
- Each idea has a populated `competitorAnalysis` field (non-empty string)
- Each idea has a valid `blueOceanScore` (0-10)
- The orchestrator successfully logs the first idea's Blue Ocean score
- All tests pass
- Code follows all architectural guidelines and ADRs