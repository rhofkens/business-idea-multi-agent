# ADR-005: Console Output Capture Method

## Status
Accepted

## Context
The Terminal Output Streaming implementation requires capturing all console.log, console.warn, and console.error outputs from agents. We need a method that:
- Preserves original console functionality for debugging
- Captures output with minimal performance impact
- Provides agent identification and timestamps
- Works reliably across all agent executions

## Decision
We will implement console output capture by creating wrapper functions that intercept console methods while preserving the original functionality.

Implementation approach:
1. Store original console methods in a safe location
2. Create wrapper functions that capture output and call original methods
3. Apply wrappers only during agent execution context
4. Include agent name and timestamp in captured data

Example pattern:
```typescript
class ConsoleCapture {
  private originalMethods = {
    log: console.log,
    warn: console.warn,
    error: console.error
  };
  
  intercept(agentName: string, callback: (event: ConsoleEvent) => void) {
    ['log', 'warn', 'error'].forEach(method => {
      console[method] = (...args) => {
        this.originalMethods[method](...args); // Preserve original
        callback({
          level: method,
          agentName,
          message: args.map(arg => String(arg)).join(' '),
          timestamp: new Date().toISOString()
        });
      };
    });
  }
  
  restore() {
    Object.assign(console, this.originalMethods);
  }
}
```

## Consequences
- **Positive**: Original console functionality preserved
- **Positive**: Minimal performance overhead
- **Positive**: Clean separation of concerns
- **Positive**: Easy to enable/disable per agent
- **Negative**: Requires careful lifecycle management
- **Negative**: Must ensure restoration on errors

## Alternatives Considered
- **Monkey patching global console**: Too invasive, affects entire application
- **Custom logger injection**: Requires modifying all agents
- **Process stdout/stderr capture**: Loses context and structure
- **Proxy objects**: More complex with no clear benefits