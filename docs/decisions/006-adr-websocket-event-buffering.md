# ADR-006: WebSocket Event Buffering Strategy

## Status
Accepted

## Context
During agent workflow execution, events may be generated when no WebSocket clients are connected. We need a strategy to handle these events without losing important information while preventing memory issues from unbounded growth.

Requirements:
- Events should be available when clients connect mid-execution
- Memory usage must be bounded
- Recent events are more valuable than old ones
- Implementation should be simple for Phase 1

## Decision
We will implement a ring buffer with a fixed size of 1000 events per session.

Implementation details:
1. Use a circular buffer data structure
2. Maximum 1000 events per session
3. When buffer is full, oldest events are overwritten
4. Events are cleared when session completes
5. Buffer is stored in memory (not persisted)

Example implementation:
```typescript
class EventBuffer {
  private buffer: WorkflowEvent[] = [];
  private maxSize = 1000;
  private head = 0;
  
  push(event: WorkflowEvent) {
    if (this.buffer.length < this.maxSize) {
      this.buffer.push(event);
    } else {
      this.buffer[this.head] = event;
      this.head = (this.head + 1) % this.maxSize;
    }
  }
  
  getAll(): WorkflowEvent[] {
    if (this.buffer.length < this.maxSize) {
      return [...this.buffer];
    }
    // Return in correct order for ring buffer
    return [
      ...this.buffer.slice(this.head),
      ...this.buffer.slice(0, this.head)
    ];
  }
}
```

## Consequences
- **Positive**: Bounded memory usage
- **Positive**: Simple implementation
- **Positive**: Recent events always available
- **Positive**: No external dependencies
- **Negative**: Old events may be lost in long workflows
- **Negative**: Fixed size may not suit all use cases

## Alternatives Considered
- **Unlimited buffering**: Memory exhaustion risk
- **Time-based expiration**: More complex, requires cleanup timer
- **Persistent queue (Redis)**: Over-engineered for Phase 1
- **No buffering**: Poor user experience when connecting late