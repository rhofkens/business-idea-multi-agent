# ADR-002: Asynchronous Agent Workflow Triggering

## Status
Accepted

## Context
The Business Preference Integration (Step 2) requires triggering the existing agent workflow asynchronously after receiving business preferences via the POST /api/preferences endpoint. The API must return immediately with a process ID without waiting for the agent workflow to complete.

The architecture guidelines state "For asynchronous operations, use Node.js promises and async/await" but don't specify the exact pattern for fire-and-forget operations where we don't await the result.

## Decision
We will use the following pattern for asynchronous agent workflow triggering:

1. Use `setImmediate()` to defer the agent workflow execution to the next iteration of the event loop
2. Wrap the agent execution in a Promise with proper error handling that logs errors but doesn't crash the process
3. Do NOT await this promise in the API handler

Example pattern:
```typescript
// Trigger async without awaiting
setImmediate(() => {
  executeAgentWorkflow(preferences, processId)
    .catch((error) => {
      logger.error('Agent workflow failed', { processId, error });
    });
});
```

## Consequences
- **Positive**: API responses are fast and non-blocking
- **Positive**: Agent failures don't affect API availability
- **Positive**: Simple implementation without additional infrastructure
- **Negative**: No built-in retry mechanism for failed workflows
- **Negative**: Limited visibility into workflow status (addressed in future increments)

## Alternatives Considered
- **Worker Threads**: Overkill for this use case and adds complexity
- **Message Queue**: Deferred to Phase 2 as per PRD
- **Simple Promise.resolve().then()**: Less clear intent than setImmediate