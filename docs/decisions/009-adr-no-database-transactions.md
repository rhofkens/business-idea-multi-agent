# ADR-009: No Database Transactions for SQLite Operations

## Status
Accepted

## Context
Step 09 introduces SQLite persistence using Drizzle ORM for storing business ideas and orchestrator runs. A decision is needed on whether to use database transactions for multi-table operations.

## Decision
We will NOT use database transactions for SQLite operations. All database operations will be atomic at the individual query level.

## Rationale
1. **Simplicity**: The application's data flow is sequential and controlled by the orchestrator. Each operation is naturally isolated.

2. **Performance**: Without transaction overhead, individual operations complete faster, which is important for real-time WebSocket updates.

3. **Error Recovery**: The orchestrator already handles failures gracefully. If a database operation fails, the entire orchestration can be retried.

4. **Data Consistency**: The risk of inconsistency is minimal because:
   - Ideas are created once and then updated in stages
   - Each update operation is independent
   - The ULID primary keys prevent duplicate insertions

## Consequences
- Simpler repository implementations
- Faster individual operations
- Potential for partial updates if multiple operations fail mid-sequence
- Must design operations to be idempotent where possible

## Alternatives Considered
- Using transactions for all multi-operation sequences
- Using transactions only for critical operations
- Implementing a saga pattern for distributed operations

All alternatives were rejected as overengineering for the current requirements.