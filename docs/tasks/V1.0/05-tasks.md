# Step 5: Documentation & End-to-End Validation - Task Breakdown

## Overview
This document provides the detailed, actionable sub-tasks for implementing the Documentation Agent and performing end-to-end system validation as specified in `docs/plans/05-documentation-and-end-to-end-validation.md`.

## Sub-Tasks

### 1. Create Documentation Agent Schema and Types

#### 1.1 Create documentation agent input schema
- **File**: `src/schemas/documentation-agent-schemas.ts`
- **Action**: Create a new file with zod schema for the Documentation Agent input
- **Requirements**:
  - Import zod and the businessIdeaSchema from existing schemas
  - Define `DocumentationAgentInputSchema` that expects an array of fully-analyzed BusinessIdea objects
  - Add JSDoc comments explaining the schema purpose
  - Follow the pattern established in `competitor-agent-schemas.ts` and `critic-agent-schemas.ts`

#### 1.2 Create documentation agent output type
- **File**: `src/types/agent-types.ts`
- **Action**: Add new type definition for documentation agent output
- **Requirements**:
  - Define `DocumentationAgentOutput` interface with:
    - `reportPath: string` - The path where the report was saved
    - `processingTime: number` - Total execution time in milliseconds
    - `ideasProcessed: number` - Number of ideas in the report
  - Add JSDoc comments for the interface

### 2. Implement Simple Utilities

#### 2.1 Create report stitching utilities
- **File**: `src/utils/report-utilities.ts`
- **Action**: Create minimal utility functions for report assembly
- **Requirements**:
  - Function to generate timestamp-based filename (format: `business-idea-report-YYYYMMDD-HHMMSS.md`)
  - Function to stitch together report sections (intro + ideas + summary)
  - Function to identify top 3 ideas by overallScore for the summary
  - All functions should be pure and well-typed

#### 2.2 Create file system utilities
- **File**: `src/utils/file-system.ts`
- **Action**: Create utilities for file operations
- **Requirements**:
  - Function to ensure `docs/output` directory exists
  - Function to write content to file with proper error handling
  - Use Node.js `fs/promises` for async operations

### 3. Implement the Documentation Agent

#### 3.1 Replace placeholder documentation agent
- **File**: `src/agents/documentation-agent.ts`
- **Action**: Implement the full Documentation Agent logic
- **Requirements**:
  - Import necessary dependencies (@openai/agents, zod, utilities)
  - Create agent with model 'o3' (per architecture.md)
  - Implement single-idea iterative approach (per ADR 006):
    - Make one LLM call for the introduction section
    - Make one LLM call per business idea (10 calls total) to format each idea as markdown
    - Make one final LLM call for the top 3 summary section
    - Use TypeScript utilities to stitch all parts together
  - Agent instructions should clearly specify markdown formatting requirements
  - Validate input using DocumentationAgentInputSchema
  - Save to `docs/output` with timestamp filename
  - Return DocumentationAgentOutput with metadata
  - Add comprehensive JSDoc comments

#### 3.2 Create documentation agent runner function
- **File**: `src/agents/documentation-agent.ts`
- **Action**: Add a `runDocumentationAgent` function
- **Requirements**:
  - Accept validated BusinessIdea array as input
  - Orchestrate the iterative LLM calls (intro + 10 ideas + summary = 12 calls)
  - Handle the agent execution using the run() utility for each call
  - Stitch together all generated parts
  - Implement proper error handling and logging
  - Return the DocumentationAgentOutput
  - Follow the pattern from other agents (ideation, competitor, critic)

### 4. Update the Orchestrator

#### 4.1 Import and integrate documentation agent
- **File**: `src/orchestrator/agent-orchestrator.ts`
- **Action**: Add documentation agent to the orchestration flow
- **Requirements**:
  - Import the runDocumentationAgent function (currently commented out)
  - Add Step 4 after the Business Critic Agent
  - Pass the criticallyEvaluatedIdeas to the documentation agent
  - Log the documentation generation process
  - Handle any errors appropriately
  - Update the final return message to indicate report generation

#### 4.2 Add documentation agent to test cache support
- **File**: `src/orchestrator/agent-orchestrator.ts`
- **Action**: Ensure documentation agent respects test cache settings
- **Requirements**:
  - Documentation agent should NOT use test cache (it always generates fresh reports)
  - But it should work correctly when other agents use cached data

### 5. Update Main Entry Point

#### 5.1 Update main.ts for complete execution
- **File**: `src/main.ts`
- **Action**: Ensure main.ts handles the complete flow including documentation
- **Requirements**:
  - Verify that success message indicates report generation
  - Add final console output showing report location
  - Ensure proper exit codes

### 6. End-to-End Testing Preparation

#### 6.1 Create manual test checklist
- **File**: `docs/testing/manual-test-checklist.md`
- **Action**: Create comprehensive testing guide
- **Requirements**:
  - Document step-by-step process for end-to-end testing
  - Include verification points for each agent
  - List expected outputs and success criteria
  - Include troubleshooting guide for common issues

### 7. Documentation Updates

#### 7.1 Add JSDoc comments to documentation agent
- **File**: `src/agents/documentation-agent.ts`
- **Action**: Add comprehensive JSDoc documentation
- **Requirements**:
  - Document the agent's purpose and behavior
  - Explain input/output formats
  - Include usage examples
  - Document any configuration options

#### 7.2 Update project README
- **File**: `README.md`
- **Action**: Complete the README as specified
- **Requirements**:
  - Complete the "Installation" section with verified steps
  - Complete the "Usage" section with run instructions
  - Add new section describing the markdown report structure
  - Include example output snippets
  - Ensure all information is accurate and tested

## Validation Criteria

Before marking this step complete, ensure:

1. **Functional Correctness**:
   - [ ] Documentation Agent receives data without corruption
   - [ ] Markdown file is created in `docs/output` with timestamp
   - [ ] Report contains all required sections
   - [ ] Top 3 ideas are correctly identified by overallScore

2. **Output Validation**:
   - [ ] Markdown is well-formatted and readable
   - [ ] All 10 business ideas have complete tables
   - [ ] Metadata section includes accurate statistics
   - [ ] File naming follows the specified pattern

3. **System Validation**:
   - [ ] Full execution completes without errors
   - [ ] Data flows correctly through all four agents
   - [ ] Final report accurately reflects all transformations

## Technical Notes

- Follow the established patterns from other agents
- Use zod for input validation per ADR 001
- Implement single-idea iterative approach per ADR 006
- Ensure all code follows coding-guidelines.md
- Use 'o3' model for the Documentation Agent
- No automated tests required (POC phase)
- The LLM will handle all markdown formatting through prompts