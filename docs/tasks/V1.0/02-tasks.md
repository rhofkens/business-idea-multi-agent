# Sub-Tasks for Step 2: Ideation Agent Implementation

This document lists the detailed, ordered sub-tasks for the implementation of the Ideation Agent. All tasks must adhere to the project's [architecture](docs/guidelines/architecture.md), [coding guidelines](docs/guidelines/coding-guidelines.md), and the newly created [ADR-001 on structured output](docs/decisions/001-adr-structured-output-validation.md).

## 1. Dependency Management
- [ ] **Install Zod**: Add the `zod` library to the project's dependencies to handle data validation.
  ```bash
  npm install zod
  ```

## 2. Data Structures & Validation Schema
- [ ] **Define Zod Schema for Output**: In [`src/types/agent-types.ts`](src/types/agent-types.ts), create a `zod` schema named `ideationAgentOutputSchema` that precisely mirrors the `IdeationAgentOutput` TypeScript interface. This is a critical step mandated by **ADR-001** to ensure type-safe data from the LLM.
- [ ] **Export Schema**: Ensure the new `ideationAgentOutputSchema` is exported from [`src/types/agent-types.ts`](src/types/agent-types.ts) so it can be used by the agent.

## 3. Ideation Agent Implementation (`src/agents/ideation-agent.ts`)
- [ ] **Replace Placeholder Logic**: Delete the placeholder content in [`src/agents/ideation-agent.ts`](src/agents/ideation-agent.ts) and create a new class or function to house the agent's logic, such as `IdeationAgent`.
- [ ] **Develop the System Prompt**: Create a detailed system prompt that instructs the LLM to perform the following:
    - Generate exactly 10 business ideas based on the provided `BusinessPreferences`.
    - For each idea, provide a score from 0 to 10 for `disruptionPotential`, `marketPotential`, `technicalComplexity`, and `capitalIntensity`.
    - For each score, provide detailed `reasoning`.
    - The final output must be a single, raw JSON array (`IdeationAgentOutput[]`) with no conversational text or markdown formatting.
- [ ] **Implement Agent Execution Logic**:
    - Create an `execute` method that accepts `BusinessPreferences` as input.
    - Inside this method, make a call to the OpenAI API using the `@openai/agents` SDK, passing the system prompt and user preferences.
    - Receive the raw text response from the API.
- [ ] **Implement Output Parsing and Validation**:
    - Parse the raw JSON string from the API response into a JavaScript object.
    - Use the `ideationAgentOutputSchema.array().parse()` method to validate the object. This will throw a runtime error if the data does not conform to the schema, satisfying the core acceptance criterion.
    - On successful validation, return the typed `IdeationAgentOutput[]` array.

## 4. Orchestrator Integration (`src/orchestrator/agent-orchestrator.ts`)
- [ ] **Update Orchestrator**: Modify the `AgentOrchestrator` to import and call the new `IdeationAgent`.
- [ ] **Pass Preferences**: Ensure the hardcoded `BusinessPreferences` are correctly passed to the `IdeationAgent`'s `execute` method.
- [ ] **Handle Returned Data**: Receive the `IdeationAgentOutput[]` array from the agent.
- [ ] **Verify Handoff**: Add a `console.log` statement to print the `title` of the first business idea (`result[0].title`). This serves as a simple test to confirm the data handoff was successful, as per the acceptance criteria.

## 5. Documentation
- [ ] **Add JSDoc Comments**: Write comprehensive JSDoc comments for the new `IdeationAgent` class/function in [`src/agents/ideation-agent.ts`](src/agents/ideation-agent.ts). Document its purpose, parameters (`BusinessPreferences`), and return value (`Promise<IdeationAgentOutput[]>`), following the project's [coding guidelines](docs/guidelines/coding-guidelines.md).
- [ ] **Update README.md**: Add a new section to the main `README.md` file describing the role and function of the Ideation Agent within the overall system.