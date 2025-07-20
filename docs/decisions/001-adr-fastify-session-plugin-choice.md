# ADR 001: Fastify Session Plugin Choice

## Status

Accepted

## Context

The User Authentication & Session Management implementation requires a session management solution for the Fastify server. The step plan mentions two options:
- `@fastify/secure-session`: Provides encrypted, stateless sessions stored in cookies
- `@fastify/session`: Provides traditional server-side session storage with various store adapters

For Phase 1, we need:
- In-memory session storage (as specified in the step plan)
- Session sharing capability with WebSocket connections
- Simple implementation suitable for local deployment
- Ability to migrate to persistent storage in Phase 2

## Decision

We will use `@fastify/session` with the default in-memory store.

### Rationale:
1. **In-Memory Storage**: `@fastify/session` supports in-memory storage out of the box via its default MemoryStore, aligning with Phase 1 requirements
2. **WebSocket Integration**: Server-side sessions can be easily shared between HTTP and WebSocket connections using session IDs
3. **Future Migration**: Supports various store adapters (Redis, MongoDB, etc.) for easy migration to persistent storage in Phase 2
4. **Simplicity**: Traditional session management pattern is simpler to implement and debug during development

`@fastify/secure-session` uses stateless encrypted cookies which would:
- Make session sharing with WebSocket connections more complex
- Limit session data size to cookie limitations
- Not align with the in-memory storage requirement

## Consequences

**Pros:**
- Simple implementation for Phase 1
- Easy session sharing between HTTP and WebSocket
- Clear migration path to persistent storage
- Standard session management patterns

**Cons:**
- Sessions lost on server restart (acceptable for Phase 1)
- Memory usage grows with active sessions (mitigated by cleanup strategy)
- Requires session ID transmission in cookies/headers