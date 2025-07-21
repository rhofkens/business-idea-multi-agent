# ADR-003: Process ID Generation Strategy

## Status
Accepted

## Context
The POST /api/preferences endpoint must return a unique process ID to track the asynchronous agent workflow execution. The requirements don't specify the format or generation method for these IDs.

Process IDs need to be:
- Unique across all requests
- Non-guessable for basic security
- Human-readable for debugging
- Sortable by creation time for easier troubleshooting

## Decision
We will use ULID (Universally Unique Lexicographically Sortable Identifier) for process ID generation.

Format: `01ARZ3NDEKTSV4RRFFQ69G5FAV`

Implementation:
```typescript
import { ulid } from 'ulidx';

const processId = ulid();
```

## Consequences
- **Positive**: Lexicographically sortable (can sort by ID to get chronological order)
- **Positive**: Contains timestamp information
- **Positive**: Shorter than UUIDs (26 chars vs 36)
- **Positive**: URL-safe without encoding
- **Positive**: Millisecond precision timestamp
- **Negative**: Requires external dependency (ulidx)

## Alternatives Considered
- **UUID v4**: Not sortable, longer format
- **Sequential numbers**: Requires persistent counter, reveals volume
- **Timestamp + random**: Custom implementation, more error-prone
- **NanoID**: Not sortable by creation time