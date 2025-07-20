# ADR 001: Enforcing Structured Output from LLM Agents

## Status

Accepted

## Context

The system architecture requires agents to return data that strictly conforms to predefined TypeScript interfaces (e.g., `IdeationAgentOutput[]`). Language models like OpenAI's o3 are powerful but do not inherently guarantee structured, type-safe JSON output, especially for complex or nested data structures. A failure to conform to the expected type will break the type-safe data flow enforced by the `AgentOrchestrator`, leading to runtime errors.

The step plan for the Ideation Agent has a strict acceptance criterion that the agent's output array must validate against the `IdeationAgentOutput` type.

## Decision

We will use a combination of detailed, explicit prompting and the `zod` library to enforce structured output from all agents.

1.  **Prompt Engineering**: All agent prompts will include explicit instructions to generate output in a specific JSON format that directly maps to the target TypeScript interface.
2.  **Zod Schemas**: For each agent's output type (e.g., `IdeationAgentOutput`), a corresponding `zod` schema will be created.
3.  **Output Parsing & Validation**: The agent's raw JSON output will be parsed and validated against the `zod` schema immediately after the LLM call. If validation fails, the agent will either retry the call with corrective instructions or throw a structured error.

This approach leverages `zod`'s robust validation capabilities to act as a runtime guarantee that bridges the gap between the probabilistic nature of LLMs and the deterministic, type-safe requirements of our TypeScript application.

## Consequences

-   **Pros**:
    -   Greatly increases the reliability of the data flow between agents.
    -   Prevents malformed data from propagating through the system.
    -   Provides a clear, enforceable contract for an agent's output.
-   **Cons**:
    -   Adds a minor dependency (`zod`).
    -   Requires maintaining parallel `zod` schemas alongside TypeScript interfaces. However, this can be managed with `zod-to-ts` or similar tools if it becomes cumbersome.