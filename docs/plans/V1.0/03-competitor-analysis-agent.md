# Detailed Plan: Competitor Analysis Agent Implementation

This document provides the detailed implementation plan for the third increment: developing the Competitor Analysis Agent.

## 1. Detailed Scope

### Agent Logic & Tooling
- **Full Implementation**: Replace the placeholder `competitor-agent.ts` with the full agent logic.
- **Tool Integration**: Integrate the OpenAI built-in `web_search` tool into the agent, allowing it to perform live market research.
- **Detailed Prompting**: Develop a detailed prompt that instructs the agent to perform market research for each business idea it receives. The prompt must guide the agent to:
    - Identify key competitors.
    - Summarize the competitive landscape.
    - Calculate a "Blue Ocean Score" (0-10) based on market saturation.

### Data Structures & Integration
- **Input Handling**: The agent must be able to accept the `IdeationAgentOutput[]` array from the orchestrator.
- **Output Enrichment**: The agent's output must be an enhanced array of business ideas, now including a populated `competitorAnalysis` (string) and `blueOceanScore` (number) for each idea.
- **Orchestrator Integration**: Update the `AgentOrchestrator` to pass the data from the Ideation Agent to the Competitor Analysis Agent and to correctly receive the enriched data array.

### Out of Scope for this Increment
- The Business Critic and Documentation agents will remain as simple placeholders from the first increment.

## 2. Detailed Acceptance Criteria

### Functional Correctness
- **Tool Usage**: The agent successfully and consistently uses the `web_search` tool to perform market research for each of the 10 business ideas provided by the Ideation Agent.
- **Data Processing**: The agent correctly processes the entire array of 10 business ideas without errors.

### Data Validation
- **Competitor Analysis**: For each of the 10 business ideas, the `competitorAnalysis` field is populated with a non-empty string that summarizes the web search findings.
- **Blue Ocean Score**: For each of the 10 business ideas, the `blueOceanScore` field is populated with a numeric value between 0 and 10 (inclusive).
- **Data Integrity**: The agent's final output array contains all the original data from the Ideation Agent (titles, descriptions, initial scores), now enriched with the new `competitorAnalysis` and `blueOceanScore` fields.

### Integration
- **Data Handoff**: The `AgentOrchestrator` successfully receives the enriched array of 10 business ideas from the Competitor Analysis Agent. To verify, the orchestrator will log the `blueOceanScore` of the first business idea to the console, proving a successful data handoff.

## 3. Detailed Documentation Tasks

- **JSDoc Comments**: Add comprehensive JSDoc comments to the new `competitor-agent.ts` file, explaining its purpose, its use of the `web_search` tool, its parameters, and its return value.
- **README.md Update**: Add a section to the main project `README.md` that describes the Competitor Analysis Agent's role in the workflow and its responsibility for market research.