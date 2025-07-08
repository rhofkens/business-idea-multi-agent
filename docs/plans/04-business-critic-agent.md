# Detailed Plan: Business Critic Agent Implementation

This document provides the detailed implementation plan for the fourth increment: developing the Business Critic Agent.

## 1. Detailed Scope

### Agent Logic & Tooling
- **Full Implementation**: Replace the placeholder `critic-agent.ts` with the full agent logic.
- **Tool Integration**: Integrate the OpenAI built-in `web_search` tool to allow the agent to perform research for risk assessment.
- **Detailed Prompting**: Develop a detailed prompt that instructs the agent to perform a critical evaluation and risk assessment for each business idea it receives. The prompt must guide the agent to:
    - Identify potential risks, challenges, and weaknesses.
    - Provide a balanced and realistic "critical analysis."
    - Calculate a final "Overall Score" (0-10) based on all available data.

### Data Structures & Integration
- **Input Handling**: The agent must accept the enriched data array from the Competitor Analysis Agent.
- **Output Enrichment**: The agent's output must be the final, fully-enriched array of business ideas, now including a populated `criticalAnalysis` (string) and `overallScore` (number) for each idea.
- **Orchestrator Integration**: Update the `AgentOrchestrator` to pass the data from the Competitor Analysis Agent to the Business Critic Agent and to receive the final, fully-analyzed data array.

### Out of Scope for this Increment
- The Documentation Agent will remain as a simple placeholder.

## 2. Detailed Acceptance Criteria

### Functional Correctness
- **Tool Usage**: The agent successfully and consistently uses the `web_search` tool to perform risk assessment for each of the 10 business ideas.
- **Data Processing**: The agent correctly processes the entire array of 10 business ideas passed from the Competitor Analysis Agent without errors.

### Data Validation
- **Critical Analysis**: For each of the 10 business ideas, the `criticalAnalysis` field is populated with a non-empty string that provides a balanced evaluation.
- **Overall Score**: For each of the 10 business ideas, the `overallScore` field is populated with a numeric value between 0 and 10 (inclusive).
- **Data Integrity**: The agent's final output array contains all previously gathered data, now enriched with the new `criticalAnalysis` and `overallScore` fields, completing the data model.

### Integration
- **Data Handoff**: The `AgentOrchestrator` successfully receives the final, fully-analyzed array of 10 ideas from the Business Critic Agent. To verify, the orchestrator will log the `overallScore` of the first business idea to the console, proving a successful data handoff.

## 3. Detailed Documentation Tasks

- **JSDoc Comments**: Add comprehensive JSDoc comments to the new `critic-agent.ts` file, explaining its purpose, its use of the `web_search` tool for risk assessment, its parameters, and its return value.
- **README.md Update**: Add a section to the main project `README.md` that describes the Business Critic Agent's role in performing the final evaluation and scoring.