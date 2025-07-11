# ADR-004: Test Cache Service for Agent Development

## Status
Accepted

## Context
During development of the AI agent system, we faced several challenges:

1. **High API Costs**: Each run of the agent chain consumes significant tokens, especially with o3-mini model usage
2. **Development Velocity**: Waiting for full agent execution (2-5 minutes) for each code change slows iteration
3. **Debugging Complexity**: When issues arise in later agents, developers must wait for earlier agents to complete
4. **Inconsistent Test Data**: Different runs produce different results, making it hard to debug specific issues

The agent chain is deterministic in order but non-deterministic in output due to LLM variability. This creates a need for a mechanism to cache intermediate results during development.

## Decision
We will implement a Test Cache Service that:

1. **Caches Agent Outputs**: Stores the output of each agent in JSON files under `tests/cache/`
2. **Provides Conditional Execution**: Only runs agents whose outputs are not cached
3. **Enables Targeted Development**: Developers can work on specific agents without re-running the entire chain
4. **Supports Cache Invalidation**: Developers can delete specific cache files to force re-execution

### Implementation Details

The service is implemented as a singleton (`src/services/test-cache-service.ts`) with these methods:
- `load<T>(key: string): T | null` - Loads cached data if available
- `save<T>(key: string, data: T): void` - Saves data to cache
- `isEnabled(): boolean` - Checks if cache mode is active via `--test-cache` flag

Cache files are stored as:
- `tests/cache/ideation-ideas.json` - Ideation agent output
- `tests/cache/competitor-ideas.json` - Competitor analysis output
- `tests/cache/critic-ideas.json` - Business critic output (future)
- `tests/cache/final-ideas.json` - Final prioritized output (future)

## Consequences

### Positive
1. **Reduced Costs**: 80-90% reduction in API calls during development
2. **Faster Iteration**: Developers can test changes in seconds instead of minutes
3. **Consistent Testing**: Same input data for debugging specific agent behaviors
4. **Focused Development**: Work on individual agents without dependencies
5. **Git-Ignored**: Cache files don't pollute version control

### Negative
1. **Cache Staleness**: Developers must remember to clear cache when testing end-to-end flows
2. **Storage Overhead**: Cache files can accumulate (mitigated by .gitignore)
3. **Development-Only**: Must ensure cache is never used in production
4. **Manual Management**: Developers must manually delete files to refresh cache

### Mitigation
- Clear documentation about when to use/clear cache
- `--test-cache` flag makes it opt-in only
- Console messages clearly indicate when cache is being used
- Cache directory is excluded from version control

## Example Usage

```bash
# First run - generates and caches all outputs
npm run start -- --test-cache

# Subsequent runs - uses cached ideation, only runs competitor analysis
npm run start -- --test-cache

# Force fresh ideation
rm tests/cache/ideation-ideas.json
npm run start -- --test-cache

# Production run - no cache
npm run start
```

## Alternatives Considered

1. **In-Memory Cache**: Would not persist across runs, defeating the purpose
2. **Database Cache**: Over-engineered for development-only feature
3. **Mocking Agents**: Would not test actual integration, only unit behavior
4. **Environment Variable**: Less explicit than CLI flag, harder to control

## References
- Test Cache Service Implementation: `src/services/test-cache-service.ts`
- Integration in Orchestrator: `src/orchestrator/agent-orchestrator.ts`
- CLI Flag Handling: `src/main.ts`